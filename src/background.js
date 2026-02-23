const api = typeof globalThis.browser !== "undefined" ? globalThis.browser : globalThis.chrome;
const TAB_DOMAINS = new Map();
const PENDING_DOMAIN_ALERT = new Map();
const ACTIVE_WINDOW_HOST = new Map();
const DEFAULT_SETTINGS = {
  language: "ru",
  defaultMode: "short",
  theme: "calm_teal",
  interceptorEnabled: true,
  timerSignalEnabled: true
};

api.runtime.onInstalled.addListener(async () => {
  const data = await api.storage.local.get(["brainflow_settings"]);
  const nextSettings = {
    ...DEFAULT_SETTINGS,
    ...(data.brainflow_settings || {})
  };
  await api.storage.local.set({ brainflow_settings: nextSettings });

  const tabsRequest = api.tabs.query({});
  if (tabsRequest?.then) {
    tabsRequest
      .then((tabs) => tabs.forEach((tab) => ensureInjected(tab.id, tab.url)))
      .catch(() => {});
  }
});

async function getTimerState() {
  const data = await api.storage.local.get(["brainflow_state"]);
  return data.brainflow_state || null;
}

function normalizeHost(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isInjectableUrl(url) {
  return typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"));
}

function maybeCatch(request) {
  if (request?.catch) {
    return request.catch(() => {});
  }
  return null;
}

function ensureInjected(tabId, url) {
  if (!tabId || !isInjectableUrl(url)) {
    return;
  }

  const injectNow = () => {
    maybeCatch(
      api.scripting.insertCSS({
        target: { tabId },
        files: ["src/content.css"]
      })
    );

    maybeCatch(
      api.scripting.executeScript({
        target: { tabId },
        files: ["src/content.js"]
      })
    );
  };

  const pingRequest = api.tabs.sendMessage(tabId, { type: "BF_PING" });
  if (pingRequest?.then) {
    pingRequest
      .then((res) => {
        if (!res?.ok) {
          injectNow();
        }
      })
      .catch(() => {
        injectNow();
      });
    return;
  }

  // Callback fallback for non-promise implementations.
  api.tabs.sendMessage(tabId, { type: "BF_PING" }, (res) => {
    const hasRuntimeError = api.runtime?.lastError;
    if (hasRuntimeError || !res?.ok) {
      injectNow();
    }
  });
}

function ensureInjectedByTabId(tabId) {
  const request = api.tabs.get(tabId);
  if (request?.then) {
    request
      .then((tab) => ensureInjected(tabId, tab?.url))
      .catch(() => {});
    return;
  }
  api.tabs.get(tabId, (tab) => {
    if (api.runtime?.lastError) {
      return;
    }
    ensureInjected(tabId, tab?.url);
  });
}

function sendDomainAlertWithRetry(tabId, host, attempts = 2) {
  if (!tabId || !host) {
    return;
  }

  getTimerState()
    .then((timerState) => {
      if (!timerState?.isRunning) {
        return;
      }

      const trySend = (left) => {
        const payload = { type: "BF_DOMAIN_CHANGED", host };
        const request = api.tabs.sendMessage(tabId, payload);

        if (request?.then) {
          request.catch(() => {
            if (left <= 0) {
              return;
            }
            ensureInjectedByTabId(tabId);
            setTimeout(() => trySend(left - 1), 220);
          });
          return;
        }

        api.tabs.sendMessage(tabId, payload, () => {
          const hasRuntimeError = Boolean(api.runtime?.lastError);
          if (!hasRuntimeError) {
            return;
          }
          if (left <= 0) {
            return;
          }
          ensureInjectedByTabId(tabId);
          setTimeout(() => trySend(left - 1), 220);
        });
      };

      trySend(attempts);
    })
    .catch(() => {});
}

function handleWindowHostTransition(tabId, windowId, host) {
  if (!tabId || typeof windowId !== "number" || !host) {
    return;
  }
  const prevHost = ACTIVE_WINDOW_HOST.get(windowId);
  ACTIVE_WINDOW_HOST.set(windowId, host);
  if (prevHost && prevHost !== host) {
    sendDomainAlertWithRetry(tabId, host);
  }
}

function processActiveTab(tabId, tab, windowIdOverride) {
  if (!tabId || !tab?.url) {
    return;
  }

  ensureInjected(tabId, tab.url);

  const currentHost = normalizeHost(tab.url);
  if (!currentHost) {
    return;
  }

  TAB_DOMAINS.set(tabId, currentHost);

  let alertSent = false;
  const pendingHost = PENDING_DOMAIN_ALERT.get(tabId);
  if (pendingHost) {
    PENDING_DOMAIN_ALERT.delete(tabId);
    sendDomainAlertWithRetry(tabId, pendingHost);
    alertSent = true;
  }

  const windowId = typeof windowIdOverride === "number" ? windowIdOverride : tab.windowId;
  if (!alertSent) {
    handleWindowHostTransition(tabId, windowId, currentHost);
    return;
  }
  ACTIVE_WINDOW_HOST.set(windowId, currentHost);
}

function injectIntoOpenTabs() {
  const request = api.tabs.query({});
  if (request?.then) {
    request
      .then((tabs) => {
        tabs.forEach((tab) => ensureInjected(tab.id, tab.url));
      })
      .catch(() => {});
    return;
  }
  api.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => ensureInjected(tab.id, tab.url));
  });
}

api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (typeof changeInfo.url === "string") {
    const newHost = normalizeHost(changeInfo.url);
    if (!newHost) {
      return;
    }
    const prevHost = TAB_DOMAINS.get(tabId);
    TAB_DOMAINS.set(tabId, newHost);
    if (prevHost && prevHost !== newHost) {
      PENDING_DOMAIN_ALERT.set(tabId, newHost);
    } else {
      PENDING_DOMAIN_ALERT.delete(tabId);
    }
    return;
  }

  if (changeInfo.status !== "complete" || !tab?.url) {
    return;
  }
  if (!tab.active) {
    return;
  }
  processActiveTab(tabId, tab, tab.windowId);
});

api.tabs.onActivated.addListener(({ tabId, windowId }) => {
  const request = api.tabs.get(tabId);
  if (request?.then) {
    request
      .then((tab) => {
        processActiveTab(tabId, tab, windowId);
      })
      .catch(() => {});
    return;
  }
  api.tabs.get(tabId, (tab) => {
    if (api.runtime?.lastError) {
      return;
    }
    processActiveTab(tabId, tab, windowId);
  });
});

if (api.runtime.onStartup) {
  api.runtime.onStartup.addListener(() => {
    injectIntoOpenTabs();
  });
}

if (api.windows?.onFocusChanged) {
  api.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === api.windows.WINDOW_ID_NONE) {
      return;
    }
    const request = api.tabs.query({ active: true, windowId });
    if (request?.then) {
      request
        .then((tabs) => {
          const tab = tabs?.[0];
          if (tab?.id) {
            processActiveTab(tab.id, tab, windowId);
          }
        })
        .catch(() => {});
      return;
    }
    api.tabs.query({ active: true, windowId }, (tabs) => {
      if (api.runtime?.lastError) {
        return;
      }
      const tab = tabs?.[0];
      if (tab?.id) {
        processActiveTab(tab.id, tab, windowId);
      }
    });
  });
}

api.tabs.onRemoved.addListener((tabId, removeInfo) => {
  TAB_DOMAINS.delete(tabId);
  PENDING_DOMAIN_ALERT.delete(tabId);
  if (removeInfo?.isWindowClosing && typeof removeInfo.windowId === "number") {
    ACTIVE_WINDOW_HOST.delete(removeInfo.windowId);
  }
});

api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "BF_OPEN_STATS") {
    const request = api.tabs.create({ url: api.runtime.getURL("src/stats.html") });
    if (request?.then) {
      request
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }
  if (message?.type === "BF_OPEN_OPTIONS") {
    const request = api.runtime.openOptionsPage?.();
    if (request?.then) {
      request
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
    } else {
      sendResponse({ ok: true });
    }
    return true;
  }
  return false;
});

// Also run once when service worker wakes up (e.g. extension reload/update),
// so widget appears on already-open tabs without manual page refresh.
injectIntoOpenTabs();
