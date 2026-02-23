const api = typeof globalThis.browser !== "undefined" ? globalThis.browser : globalThis.chrome;

const THEME_KEYS = ["calm_teal", "deep_blue", "soft_amber", "mono"];

const DEFAULT_SETTINGS = {
  language: "ru",
  defaultMode: "short",
  theme: "calm_teal",
  interceptorEnabled: true,
  timerSignalEnabled: true
};

const TEXT = {
  ru: {
    title: "Настройки BrainFlow",
    generalTitle: "Основное",
    langLabel: "Язык",
    themeLabel: "Тема",
    modeLabel: "Режим таймера по умолчанию",
    focusTitle: "Помощник фокуса",
    interceptorLabel: "Включить перехватчик прокрастинации",
    signalLabel: "Включить сигнал окончания таймера",
    dataTitle: "Данные",
    reset: "Сбросить всю статистику",
    resetHint: "Это действие нельзя отменить.",
    save: "Сохранить",
    saved: "Сохранено",
    resetConfirm: "Удалить всю статистику BrainFlow?",
    resetDone: "Статистика очищена",
    themes: {
      calm_teal: "Calm Teal",
      deep_blue: "Deep Blue Focus",
      soft_amber: "Soft Amber",
      mono: "Monochrome"
    }
  },
  en: {
    title: "BrainFlow Settings",
    generalTitle: "General",
    langLabel: "Language",
    themeLabel: "Theme",
    modeLabel: "Default timer mode",
    focusTitle: "Focus assistant",
    interceptorLabel: "Enable procrastination interceptor",
    signalLabel: "Enable timer end signal",
    dataTitle: "Data",
    reset: "Reset all statistics",
    resetHint: "This action cannot be undone.",
    save: "Save",
    saved: "Saved",
    resetConfirm: "Delete all BrainFlow stats?",
    resetDone: "Statistics cleared",
    themes: {
      calm_teal: "Calm Teal",
      deep_blue: "Deep Blue Focus",
      soft_amber: "Soft Amber",
      mono: "Monochrome"
    }
  }
};

function tr(lang) {
  return TEXT[lang] || TEXT.ru;
}

function normalizeSettings(value) {
  const next = { ...DEFAULT_SETTINGS, ...(value || {}) };
  next.language = next.language === "en" ? "en" : "ru";
  next.defaultMode = next.defaultMode === "standard" ? "standard" : "short";
  next.theme = THEME_KEYS.includes(next.theme) ? next.theme : "calm_teal";
  next.interceptorEnabled = Boolean(next.interceptorEnabled);
  next.timerSignalEnabled = Boolean(next.timerSignalEnabled);
  return next;
}

async function getSettings() {
  const data = await api.storage.local.get(["brainflow_settings"]);
  return normalizeSettings(data.brainflow_settings);
}

async function saveSettings(settings) {
  await api.storage.local.set({ brainflow_settings: settings });
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
}

function setThemeOptionLabels(lang) {
  const text = tr(lang);
  const themeEl = document.getElementById("theme");
  Array.from(themeEl.options).forEach((option) => {
    option.textContent = text.themes[option.value] || option.value;
  });
}

function setText(settings) {
  const text = tr(settings.language);
  document.getElementById("title").textContent = text.title;
  document.getElementById("general-title").textContent = text.generalTitle;
  document.getElementById("lang-label").textContent = text.langLabel;
  document.getElementById("theme-label").textContent = text.themeLabel;
  document.getElementById("mode-label").textContent = text.modeLabel;
  document.getElementById("focus-title").textContent = text.focusTitle;
  document.getElementById("interceptor-label").textContent = text.interceptorLabel;
  document.getElementById("signal-label").textContent = text.signalLabel;
  document.getElementById("data-title").textContent = text.dataTitle;
  document.getElementById("reset-stats").textContent = text.reset;
  document.getElementById("reset-hint").textContent = text.resetHint;
  document.getElementById("save").textContent = text.save;
  setThemeOptionLabels(settings.language);
  applyTheme(settings.theme);
}

async function init() {
  let settings = await getSettings();

  const languageEl = document.getElementById("language");
  const themeEl = document.getElementById("theme");
  const defaultModeEl = document.getElementById("default-mode");
  const interceptorEl = document.getElementById("interceptor-enabled");
  const signalEl = document.getElementById("timer-signal-enabled");
  const statusEl = document.getElementById("status");

  languageEl.value = settings.language;
  themeEl.value = settings.theme;
  defaultModeEl.value = settings.defaultMode;
  interceptorEl.checked = settings.interceptorEnabled;
  signalEl.checked = settings.timerSignalEnabled;
  setText(settings);

  languageEl.addEventListener("change", () => {
    settings = normalizeSettings({ ...settings, language: languageEl.value });
    setText(settings);
  });

  themeEl.addEventListener("change", () => {
    settings = normalizeSettings({ ...settings, theme: themeEl.value });
    applyTheme(settings.theme);
  });

  document.getElementById("save").addEventListener("click", async () => {
    settings = normalizeSettings({
      language: languageEl.value,
      theme: themeEl.value,
      defaultMode: defaultModeEl.value,
      interceptorEnabled: interceptorEl.checked,
      timerSignalEnabled: signalEl.checked
    });

    await saveSettings(settings);
    statusEl.textContent = tr(settings.language).saved;
    setTimeout(() => {
      statusEl.textContent = "";
    }, 1500);
  });

  document.getElementById("reset-stats").addEventListener("click", async () => {
    const text = tr(settings.language);
    if (!window.confirm(text.resetConfirm)) {
      return;
    }
    await api.storage.local.set({ brainflow_daily: {} });
    statusEl.textContent = text.resetDone;
  });
}

init().catch(console.error);
