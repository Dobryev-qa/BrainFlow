(function () {
  globalThis.__brainflowScriptLoaded = true;

const api = typeof globalThis.browser !== "undefined" ? globalThis.browser : globalThis.chrome;

const MODES = {
  short: { workMin: 10, breakMin: 3, label: "10/3" },
  standard: { workMin: 15, breakMin: 5, label: "15/5" }
};

const TEXT = {
  ru: {
    title: "BrainFlow",
    focus: "Фокус",
    rest: "Отдых",
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    done: "Задача выполнена",
    stats: "Статистика",
    settings: "Настройки",
    resize: "Изменить размер",
    collapse: "Свернуть",
    restNotice: (n) => `Отдохни ${n} минут`,
    backToWork: "Пора работать",
    fireDay: "Отличный темп сегодня 🔥",
    interceptor: [
      "Эй, ты сюда точно хотел?",
      "А задача сама себя не сделает...",
      "Твой мозг убегает. Поймай его.",
      "Это важнее того, что ты делал?",
      "Проверь себя: зачем ты здесь?"
    ]
  },
  en: {
    title: "BrainFlow",
    focus: "Focus",
    rest: "Break",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    done: "Task done",
    stats: "Stats",
    settings: "Settings",
    resize: "Resize",
    collapse: "Collapse",
    restNotice: (n) => `Take a ${n}-minute break`,
    backToWork: "Time to focus",
    fireDay: "Outstanding pace today 🔥",
    interceptor: [
      "Hey, was this the plan?",
      "Your task will not finish itself...",
      "Your focus is slipping. Catch it.",
      "Is this more important than your goal?",
      "Quick check: why are you here?"
    ]
  }
};

const DEFAULT_SETTINGS = {
  language: "ru",
  defaultMode: "short",
  theme: "calm_teal",
  interceptorEnabled: true,
  timerSignalEnabled: true
};

const DEFAULT_STATE = {
  mode: "short",
  phase: "work",
  isRunning: false,
  remainingMs: MODES.short.workMin * 60_000,
  endTs: null,
  collapsed: false
};

const STORAGE_KEYS = {
  state: "brainflow_state",
  position: "brainflow_position",
  size: "brainflow_size",
  daily: "brainflow_daily",
  settings: "brainflow_settings"
};

let state = { ...DEFAULT_STATE };
let settings = { ...DEFAULT_SETTINGS };
let timerInterval = null;
let inactivityTimeout = null;
let widget = null;
let ringEl = null;
let timeEl = null;
let phaseEl = null;
let startPauseBtn = null;
let resetBtn = null;
let doneBtn = null;
let modeBtns = {};
let brainsEl = null;
let collapsedWrap = null;
let collapsedRingEl = null;
let collapsedTimeEl = null;
let expandedWrap = null;
let interceptorEl = null;
let titleEl = null;
let collapseBtn = null;
let statsBtn = null;
let settingsBtn = null;
let langBtn = null;
let suppressCollapseClick = false;
let rootEl = null;
let presenceInterval = null;
let lastFocusPromptTs = 0;
const FOCUS_PROMPT_COOLDOWN_MS = 25_000;

function t() {
  return TEXT[settings.language] || TEXT.ru;
}

function normalizeSettings(value) {
  const next = { ...DEFAULT_SETTINGS, ...(value || {}) };
  const validThemes = new Set(["calm_teal", "deep_blue", "soft_amber", "mono"]);
  next.language = next.language === "en" ? "en" : "ru";
  next.defaultMode = next.defaultMode === "standard" ? "standard" : "short";
  next.theme = validThemes.has(next.theme) ? next.theme : "calm_teal";
  next.interceptorEnabled = Boolean(next.interceptorEnabled);
  next.timerSignalEnabled = Boolean(next.timerSignalEnabled);
  return next;
}

function normalizeState(value) {
  const next = { ...DEFAULT_STATE, ...(value || {}) };
  next.mode = next.mode === "standard" ? "standard" : "short";
  next.phase = next.phase === "break" ? "break" : "work";
  next.isRunning = Boolean(next.isRunning);
  next.collapsed = Boolean(next.collapsed);
  next.endTs = typeof next.endTs === "number" ? next.endTs : null;
  next.remainingMs =
    typeof next.remainingMs === "number" && next.remainingMs > 0
      ? next.remainingMs
      : modeDurationMs(next.mode, next.phase);
  return next;
}

function todayKey() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function modeDurationMs(mode, phase) {
  const selected = MODES[mode] || MODES.short;
  const minutes = phase === "work" ? selected.workMin : selected.breakMin;
  return minutes * 60_000;
}

function formatMs(ms) {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const min = `${Math.floor(safe / 60)}`.padStart(2, "0");
  const sec = `${safe % 60}`.padStart(2, "0");
  return `${min}:${sec}`;
}

function getRemainingMs() {
  if (!state.isRunning || !state.endTs) {
    return state.remainingMs;
  }
  return Math.max(0, state.endTs - Date.now());
}

async function loadState() {
  const data = await api.storage.local.get([STORAGE_KEYS.state, STORAGE_KEYS.settings]);
  const savedState = data[STORAGE_KEYS.state];

  if (savedState) {
    state = normalizeState(savedState);
  }

  if (data[STORAGE_KEYS.settings]) {
    settings = normalizeSettings(data[STORAGE_KEYS.settings]);
  }

  if (!savedState) {
    state.mode = settings.defaultMode === "standard" ? "standard" : "short";
    state.remainingMs = modeDurationMs(state.mode, "work");
  }

  if (state.isRunning && state.endTs) {
    const remaining = state.endTs - Date.now();
    state.remainingMs = Math.max(0, remaining);
    if (remaining <= 0) {
      await onPhaseCompleted();
    }
  }
}

async function saveState() {
  await api.storage.local.set({ [STORAGE_KEYS.state]: state });
}

async function saveSettings() {
  await api.storage.local.set({ [STORAGE_KEYS.settings]: settings });
}

function updateTexts() {
  titleEl.textContent = t().title;
  collapseBtn.title = t().collapse;
  statsBtn.title = t().stats;
  settingsBtn.title = t().settings;
  doneBtn.textContent = t().done;
  resetBtn.textContent = t().reset;
  langBtn.textContent = settings.language.toUpperCase();
  applyTheme();
}

function updateRing() {
  const total = modeDurationMs(state.mode, state.phase);
  const remaining = getRemainingMs();
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  ringEl.style.background = `conic-gradient(var(--bf-ring-active) ${percent}%, var(--bf-ring-track) 0)`;
  timeEl.textContent = formatMs(remaining);
  collapsedTimeEl.textContent = formatMs(remaining);
  collapsedRingEl.style.setProperty("--progress", `${percent}%`);
  collapsedRingEl.classList.toggle("running", state.isRunning);
  phaseEl.textContent = state.phase === "work" ? t().focus : t().rest;
  startPauseBtn.textContent = state.isRunning ? t().pause : t().start;

  Object.entries(modeBtns).forEach(([mode, btn]) => {
    btn.classList.toggle("active", mode === state.mode);
  });
}

function applyTheme() {
  if (rootEl) {
    rootEl.dataset.theme = settings.theme || "calm_teal";
  }
}

function beep() {
  if (!settings.timerSignalEnabled) {
    return;
  }

  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 740;
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.35);
}

function pushNotice(message) {
  if (settings.interceptorEnabled) {
    showInterceptor(message);
  }
}

async function updateDaily(partial) {
  const key = todayKey();
  const data = await api.storage.local.get([STORAGE_KEYS.daily]);
  const daily = data[STORAGE_KEYS.daily] || {};
  const current = daily[key] || { cycles: 0, brains: 0, focusMinutes: 0 };
  daily[key] = {
    cycles: current.cycles + (partial.cycles || 0),
    brains: current.brains + (partial.brains || 0),
    focusMinutes: current.focusMinutes + (partial.focusMinutes || 0)
  };
  await api.storage.local.set({ [STORAGE_KEYS.daily]: daily });
  await renderBrains();
}

async function renderBrains() {
  const key = todayKey();
  const data = await api.storage.local.get([STORAGE_KEYS.daily]);
  const tasks = data[STORAGE_KEYS.daily]?.[key]?.brains || 0;
  brainsEl.innerHTML = "";

  const visibleLimit = 8;
  const visible = Math.min(tasks, visibleLimit);

  for (let i = 0; i < visible; i += 1) {
    const span = document.createElement("span");
    span.className = "brainflow-brain";
    if (tasks >= 5) {
      span.classList.add("milestone-5");
    }
    span.textContent = "";
    brainsEl.appendChild(span);
  }

  if (tasks > visibleLimit) {
    const more = document.createElement("span");
    more.className = "brainflow-brain brainflow-brain-more";
    more.textContent = `+${tasks - visibleLimit}`;
    brainsEl.appendChild(more);
  }
}

async function onPhaseCompleted() {
  const prevPhase = state.phase;
  state.phase = state.phase === "work" ? "break" : "work";
  state.remainingMs = modeDurationMs(state.mode, state.phase);
  state.endTs = Date.now() + state.remainingMs;
  state.isRunning = true;

  if (prevPhase === "work") {
    await updateDaily({
      cycles: 1,
      focusMinutes: MODES[state.mode].workMin
    });
    beep();
    pushNotice(t().restNotice(MODES[state.mode].breakMin));
  } else {
    beep();
    pushNotice(t().backToWork);
  }

  await saveState();
  updateRing();
}

async function tick() {
  if (!state.isRunning) {
    updateRing();
    return;
  }

  const remaining = getRemainingMs();
  state.remainingMs = remaining;

  if (remaining <= 0) {
    await onPhaseCompleted();
  }

  updateRing();
}

async function handleStartPause() {
  if (state.isRunning) {
    state.remainingMs = getRemainingMs();
    state.isRunning = false;
    state.endTs = null;
  } else {
    beep();
    state.isRunning = true;
    state.endTs = Date.now() + state.remainingMs;
    armInactivityWatcher();
  }

  await saveState();
  updateRing();
}

async function handleReset() {
  state.phase = "work";
  state.isRunning = false;
  state.endTs = null;
  state.remainingMs = modeDurationMs(state.mode, "work");
  await saveState();
  updateRing();
}

async function switchMode(mode) {
  if (!MODES[mode] || state.mode === mode) {
    return;
  }

  state.mode = mode;
  state.phase = "work";
  state.isRunning = false;
  state.endTs = null;
  state.remainingMs = modeDurationMs(mode, "work");
  await saveState();
  updateRing();
}

function applyExternalSettings(nextSettings) {
  const prev = settings;
  settings = normalizeSettings(nextSettings);

  if (
    !state.isRunning &&
    prev.defaultMode !== settings.defaultMode &&
    state.phase === "work" &&
    state.remainingMs === modeDurationMs(prev.defaultMode, "work")
  ) {
    state.mode = settings.defaultMode;
    state.remainingMs = modeDurationMs(state.mode, "work");
    saveState().catch(() => {});
  }

  updateTexts();
  updateRing();
  armInactivityWatcher();
}

async function addBrain() {
  await updateDaily({ brains: 1 });
  const key = todayKey();
  const data = await api.storage.local.get([STORAGE_KEYS.daily]);
  const count = data[STORAGE_KEYS.daily]?.[key]?.brains || 0;

  if (count === 10 && settings.interceptorEnabled) {
    showInterceptor(t().fireDay);
  }
}

async function toggleLanguage() {
  settings.language = settings.language === "ru" ? "en" : "ru";
  await saveSettings();
  updateTexts();
  updateRing();
}

async function toggleCollapsed() {
  if (suppressCollapseClick) {
    return;
  }
  state.collapsed = !state.collapsed;
  applyCollapsedUi();
  keepWidgetVisible();
  await saveState();
}

function applyCollapsedUi() {
  expandedWrap.style.display = state.collapsed ? "none" : "block";
  collapsedWrap.style.display = state.collapsed ? "grid" : "none";
  widget.classList.toggle("is-collapsed", state.collapsed);
}

function keepWidgetVisible() {
  const rect = rootEl.getBoundingClientRect();
  const x = Math.max(0, Math.min(window.innerWidth - rect.width, rect.left));
  const y = Math.max(0, Math.min(window.innerHeight - rect.height, rect.top));
  rootEl.style.left = `${x}px`;
  rootEl.style.top = `${y}px`;
  rootEl.style.right = "auto";
  rootEl.style.bottom = "auto";
}

function dedupeById(root, id) {
  const nodes = root.querySelectorAll(`#${id}`);
  if (nodes.length <= 1) {
    return;
  }
  for (let i = 1; i < nodes.length; i += 1) {
    nodes[i].remove();
  }
}

function sanitizeWidgetStructure() {
  if (!rootEl) {
    return;
  }
  dedupeById(rootEl, "bf-expanded");
  dedupeById(rootEl, "bf-collapsed");
  dedupeById(rootEl, "bf-ring");
  dedupeById(rootEl, "bf-time");
  dedupeById(rootEl, "bf-phase");
  dedupeById(rootEl, "bf-start-pause");
  dedupeById(rootEl, "bf-reset");
  dedupeById(rootEl, "bf-done");
  dedupeById(rootEl, "bf-brains");
  dedupeById(rootEl, "bf-stats");
  dedupeById(rootEl, "bf-settings");
}

function randomMessage() {
  const list = t().interceptor;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function showInterceptor(message) {
  interceptorEl.textContent = message;
  interceptorEl.classList.remove("show");
  void interceptorEl.offsetWidth;
  interceptorEl.classList.add("show");
}

function showFocusPrompt(message) {
  const now = Date.now();
  if (now - lastFocusPromptTs < FOCUS_PROMPT_COOLDOWN_MS) {
    return;
  }
  lastFocusPromptTs = now;
  showInterceptor(message);
}

function armInactivityWatcher() {
  clearTimeout(inactivityTimeout);
  if (!state.isRunning || !settings.interceptorEnabled) {
    return;
  }

  inactivityTimeout = setTimeout(() => {
    if (state.isRunning && settings.interceptorEnabled) {
      showFocusPrompt(randomMessage());
    }
  }, 180_000);
}

function registerInactivitySignals() {
  const reset = () => {
    if (state.isRunning) {
      armInactivityWatcher();
    }
  };

  ["mousemove", "click", "scroll", "keydown"].forEach((evt) => {
    window.addEventListener(evt, reset, { passive: true });
  });
}

async function loadPosition() {
  const data = await api.storage.local.get([STORAGE_KEYS.position]);
  const pos = data[STORAGE_KEYS.position];
  if (!pos) {
    return;
  }

  const rect = rootEl.getBoundingClientRect();
  const x = Math.max(0, Math.min(window.innerWidth - rect.width, pos.x));
  const y = Math.max(0, Math.min(window.innerHeight - rect.height, pos.y));
  rootEl.style.left = `${x}px`;
  rootEl.style.top = `${y}px`;
  rootEl.style.right = "auto";
  rootEl.style.bottom = "auto";
}

async function loadSize() {
  const data = await api.storage.local.get([STORAGE_KEYS.size]);
  const size = data[STORAGE_KEYS.size];
  if (!size?.width) {
    return;
  }
  const width = Math.max(244, Math.min(380, size.width));
  widget.style.width = `${width}px`;
}

function makeDraggable(handles) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let moved = false;
  const handleList = Array.isArray(handles) ? handles : [handles];

  handleList.forEach((handle) => {
    if (!handle) {
      return;
    }
    handle.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      dragging = true;
      moved = false;
      startX = event.clientX - rootEl.getBoundingClientRect().left;
      startY = event.clientY - rootEl.getBoundingClientRect().top;
      event.preventDefault();
    });
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) {
      return;
    }
    moved = true;
    const rect = rootEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(window.innerWidth - rect.width, event.clientX - startX));
    const y = Math.max(0, Math.min(window.innerHeight - rect.height, event.clientY - startY));
    rootEl.style.left = `${x}px`;
    rootEl.style.top = `${y}px`;
    rootEl.style.right = "auto";
    rootEl.style.bottom = "auto";
  });

  window.addEventListener("mouseup", async () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (moved) {
      suppressCollapseClick = true;
      setTimeout(() => {
        suppressCollapseClick = false;
      }, 180);
    }
    keepWidgetVisible();
    const rect = rootEl.getBoundingClientRect();
    await api.storage.local.set({
      [STORAGE_KEYS.position]: {
        x: rect.left,
        y: rect.top
      }
    });
  });
}

function createDom() {
  const root = document.createElement("div");
  root.id = "brainflow-root";
  rootEl = root;

  root.innerHTML = `
    <div class="brainflow-widget" id="bf-widget">
      <div id="bf-expanded">
        <div class="brainflow-header" id="bf-drag-handle">
          <div class="brainflow-title" id="bf-title">BrainFlow</div>
          <div class="brainflow-head-actions">
            <button class="brainflow-lang-btn" id="bf-lang" title="Language">RU</button>
            <button class="brainflow-icon-btn" id="bf-collapse-btn" title="Свернуть">-</button>
          </div>
        </div>

        <div class="brainflow-ring" id="bf-ring">
          <div class="brainflow-time" id="bf-time">10:00</div>
        </div>
        <div class="brainflow-phase" id="bf-phase">Фокус</div>

        <div class="brainflow-mode">
          <button id="bf-mode-short" class="active">10/3</button>
          <button id="bf-mode-standard">15/5</button>
        </div>

        <div class="brainflow-controls">
          <button id="bf-start-pause">Старт</button>
          <button id="bf-reset">Сброс</button>
        </div>

        <button class="brainflow-done" id="bf-done">Задача выполнена</button>

        <div class="brainflow-footer">
          <div class="brainflow-brains" id="bf-brains"></div>
          <div class="brainflow-footer-controls">
            <button class="brainflow-icon-btn" id="bf-stats" title="Статистика">📊</button>
            <button class="brainflow-icon-btn" id="bf-settings" title="Настройки">⚙</button>
          </div>
        </div>
      </div>

      <div id="bf-collapsed" class="brainflow-collapsed" style="display:none;">
        <div id="bf-collapsed-ring" class="brainflow-collapsed-ring">
          <svg class="brainflow-collapsed-track" viewBox="0 0 128 48" preserveAspectRatio="none" aria-hidden="true">
            <rect class="brainflow-collapsed-dash" x="3" y="3" width="122" height="42" rx="10" ry="10"></rect>
          </svg>
          <div id="bf-collapsed-time" class="brainflow-collapsed-time">10:00</div>
        </div>
      </div>
    </div>

    <div class="brainflow-interceptor" id="bf-interceptor"></div>
  `;

  (document.body || document.documentElement).appendChild(root);
  sanitizeWidgetStructure();

  widget = root.querySelector("#bf-widget");
  widget.style.left = "";
  widget.style.top = "";
  widget.style.right = "";
  widget.style.bottom = "";
  widget.style.inset = "";
  ringEl = root.querySelector("#bf-ring");
  timeEl = root.querySelector("#bf-time");
  phaseEl = root.querySelector("#bf-phase");
  startPauseBtn = root.querySelector("#bf-start-pause");
  resetBtn = root.querySelector("#bf-reset");
  doneBtn = root.querySelector("#bf-done");
  brainsEl = root.querySelector("#bf-brains");
  collapsedWrap = root.querySelector("#bf-collapsed");
  collapsedRingEl = root.querySelector("#bf-collapsed-ring");
  collapsedTimeEl = root.querySelector("#bf-collapsed-time");
  expandedWrap = root.querySelector("#bf-expanded");
  interceptorEl = root.querySelector("#bf-interceptor");
  titleEl = root.querySelector("#bf-title");
  collapseBtn = root.querySelector("#bf-collapse-btn");
  statsBtn = root.querySelector("#bf-stats");
  settingsBtn = root.querySelector("#bf-settings");
  langBtn = root.querySelector("#bf-lang");

  modeBtns = {
    short: root.querySelector("#bf-mode-short"),
    standard: root.querySelector("#bf-mode-standard")
  };

  startPauseBtn.addEventListener("click", handleStartPause);
  resetBtn.addEventListener("click", handleReset);
  modeBtns.short.addEventListener("click", () => switchMode("short"));
  modeBtns.standard.addEventListener("click", () => switchMode("standard"));
  doneBtn.addEventListener("click", addBrain);
  collapseBtn.addEventListener("click", toggleCollapsed);
  collapsedWrap.addEventListener("click", toggleCollapsed);
  langBtn.addEventListener("click", toggleLanguage);
  statsBtn.addEventListener("click", () => {
    const request = api.runtime.sendMessage({ type: "BF_OPEN_STATS" });
    if (request?.catch) {
      request.catch(() => {});
    }
  });
  settingsBtn.addEventListener("click", () => {
    const request = api.runtime.sendMessage({ type: "BF_OPEN_OPTIONS" });
    if (request?.catch) {
      request.catch(() => {});
    }
  });

  makeDraggable([root.querySelector("#bf-drag-handle"), collapsedWrap]);

  window.addEventListener("resize", () => {
    keepWidgetVisible();
  });

  const ensureRootPresence = () => {
    if (!rootEl) {
      return;
    }
    if (!document.contains(rootEl)) {
      (document.body || document.documentElement).appendChild(rootEl);
    }

    const prevDisplay = getComputedStyle(rootEl).display;
    const prevVisibility = getComputedStyle(rootEl).visibility;
    const prevOpacity = getComputedStyle(rootEl).opacity;
    rootEl.hidden = false;
    rootEl.style.setProperty("display", "block", "important");
    rootEl.style.setProperty("visibility", "visible", "important");
    rootEl.style.setProperty("opacity", "1", "important");
    rootEl.style.setProperty("position", "fixed", "important");
    rootEl.style.setProperty("z-index", "2147483647", "important");
    sanitizeWidgetStructure();
    keepWidgetVisible();
  };

  // Some pages aggressively rewrite DOM; re-attach widget if removed.
  const observer = new MutationObserver(() => {
    ensureRootPresence();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Failsafe for sites that replace body after load and skip mutation path.
  if (presenceInterval) {
    clearInterval(presenceInterval);
  }
  presenceInterval = setInterval(ensureRootPresence, 1200);
}

async function init() {
  const existing = document.getElementById("brainflow-root");
  if (existing) {
    rootEl = existing;
    sanitizeWidgetStructure();
    const existingWidget = existing.querySelector("#bf-widget");
    if (existingWidget) {
      existingWidget.style.left = "";
      existingWidget.style.top = "";
      existingWidget.style.right = "";
      existingWidget.style.bottom = "";
      existingWidget.style.inset = "";
    }
    existing.style.setProperty("display", "block", "important");
    existing.style.setProperty("visibility", "visible", "important");
    existing.style.setProperty("opacity", "1", "important");
    existing.style.setProperty("position", "fixed", "important");
    existing.style.setProperty("z-index", "2147483647", "important");
    return;
  }
  window.__brainflowMounted = true;

  createDom();
  await loadState();
  await loadPosition();
  await loadSize();
  keepWidgetVisible();

  applyCollapsedUi();

  updateTexts();
  await renderBrains();
  updateRing();
  registerInactivitySignals();
  armInactivityWatcher();

  timerInterval = setInterval(() => {
    tick().catch(() => {});
  }, 1000);

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "BF_PING") {
      sendResponse({ ok: true });
      return true;
    }
    if (message?.type === "BF_DOMAIN_CHANGED" && state.isRunning && settings.interceptorEnabled) {
      showFocusPrompt(randomMessage());
    }
    return false;
  });

  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEYS.settings]?.newValue) {
      return;
    }
    applyExternalSettings(changes[STORAGE_KEYS.settings].newValue);
  });
}

init().catch(console.error);

})();
