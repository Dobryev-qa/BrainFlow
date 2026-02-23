const api = typeof globalThis.browser !== "undefined" ? globalThis.browser : globalThis.chrome;

const THEME_KEYS = new Set(["calm_teal", "deep_blue", "soft_amber", "mono"]);

const TEXT = {
  ru: {
    subtitle: "Виджет активен на всех вкладках.",
    openStats: "Открыть статистику",
    openSettings: "Настройки"
  },
  en: {
    subtitle: "Widget is active on all pages.",
    openStats: "Open stats",
    openSettings: "Settings"
  }
};

async function init() {
  const data = await api.storage.local.get(["brainflow_settings"]);
  const settings = data.brainflow_settings || {};
  const lang = settings.language === "en" ? "en" : "ru";
  const theme = THEME_KEYS.has(settings.theme) ? settings.theme : "calm_teal";

  document.body.dataset.theme = theme;
  document.getElementById("subtitle").textContent = TEXT[lang].subtitle;
  document.getElementById("open-stats").textContent = TEXT[lang].openStats;
  document.getElementById("open-settings").textContent = TEXT[lang].openSettings;

  document.getElementById("open-stats").addEventListener("click", async () => {
    await api.runtime.sendMessage({ type: "BF_OPEN_STATS" });
    window.close();
  });

  document.getElementById("open-settings").addEventListener("click", () => {
    const openRequest = api.runtime.openOptionsPage();
    if (openRequest?.catch) {
      openRequest.catch(() => {});
    }
    window.close();
  });
}

init().catch(console.error);
