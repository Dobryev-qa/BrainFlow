# BrainFlow

[Русский](#русский) | [English](#english)

## Русский

BrainFlow — современный плавающий виджет фокуса для вкладок браузера, ориентированный на ADHD-friendly сценарии работы.

### Что умеет

- Плавающий виджет на любой странице
- Режимы таймера Фокус/Отдых: `10/3` и `15/5`
- Кнопки Старт / Пауза / Сброс с сохранением состояния
- Компактный свернутый режим таймера
- Учёт выполненных задач и дневного прогресса
- Антипрокрастинационный перехватчик (смена домена + напоминание при неактивности)
- Интерфейс на RU/EN
- 4 темы оформления: `calm_teal`, `deep_blue`, `soft_amber`, `mono`
- Встроенная страница статистики с календарём и стриком
- Страница настроек (язык, тема, режим по умолчанию, сигналы, перехватчик)
- Локальное хранение данных (`chrome.storage.local`)

### Поддерживаемые браузеры

- Chrome / Edge (Manifest V3)
- Safari (через официальный Safari Web Extension converter)

### Установка для разработки (Chrome)

1. Откройте `chrome://extensions`
2. Включите **Developer mode**
3. Нажмите **Load unpacked**
4. Выберите папку проекта:
   - `/Users/WorkShop/QA/ BrainFlow`

### Конвертация для Safari

```bash
xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
```

Далее:

1. Откройте сгенерированный Xcode-проект
2. Настройте Team и signing
3. Соберите и запустите
4. Включите расширение в настройках Safari

### Структура проекта

- `manifest.json` — манифест расширения (MV3)
- `src/content.js` / `src/content.css` — логика и стили виджета на сайтах
- `src/background.js` — service worker и интеграция с событиями вкладок
- `src/popup.*` — popup расширения
- `src/options/*` — интерфейс настроек
- `src/stats.*` — интерфейс статистики и календаря
- `assets/icons/*` — иконки расширения
- `tools/release-check.js` — автоматическая проверка перед релизом
- `store/*` — материалы для стора (RU/EN)
- `PRIVACY_POLICY.md` — политика конфиденциальности
- `RELEASE_CHECKLIST.md` — ручной чеклист релиза

### Проверка перед релизом

```bash
node tools/release-check.js
```

Ручной чеклист:

- `RELEASE_CHECKLIST.md`

### Сборка ZIP для загрузки в Store

```bash
zip -r BrainFlow-v1.0.0.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

### Приватность

BrainFlow не отправляет пользовательские данные на внешние серверы.
Все настройки и статистика хранятся локально в браузере.

Подробнее: `PRIVACY_POLICY.md`

### Материалы для публикации

- `store/GO_LIVE.md`
- `store/CHROME_LISTING_RU.md`
- `store/CHROME_LISTING_EN.md`

## English

BrainFlow is a modern floating focus widget for browser tabs, designed for ADHD-friendly work sessions.

### What it does

- Floating draggable widget on any page
- Focus/Break timer modes: `10/3` and `15/5`
- Start / Pause / Reset flow with persisted state
- Collapsed compact timer mode
- Task completion tracking with daily progress
- Procrastination interceptor (domain change + inactivity reminder)
- RU/EN interface
- 4 visual themes: `calm_teal`, `deep_blue`, `soft_amber`, `mono`
- Built-in stats page with monthly calendar and streak
- Settings page (language, theme, default mode, signals, interceptor)
- Local-only data storage (`chrome.storage.local`)

### Browser support

- Chrome / Edge (Manifest V3)
- Safari (via official Safari Web Extension conversion)

### Install for development (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select project folder:
   - `/Users/WorkShop/QA/ BrainFlow`

### Safari conversion

```bash
xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
```

Then:

1. Open generated Xcode project
2. Configure Team and signing
3. Build and run
4. Enable extension in Safari settings

### Project structure

- `manifest.json` — extension manifest (MV3)
- `src/content.js` / `src/content.css` — widget logic and styles on pages
- `src/background.js` — service worker and tab/events integration
- `src/popup.*` — browser action popup
- `src/options/*` — settings UI
- `src/stats.*` — statistics and calendar UI
- `assets/icons/*` — extension icons
- `tools/release-check.js` — release sanity check script
- `store/*` — store listing materials (RU/EN)
- `PRIVACY_POLICY.md` — privacy policy
- `RELEASE_CHECKLIST.md` — manual QA checklist

### Release checks

```bash
node tools/release-check.js
```

Manual checklist:

- `RELEASE_CHECKLIST.md`

### Build ZIP for store upload

```bash
zip -r BrainFlow-v1.0.0.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

### Privacy

BrainFlow does not send user data to external servers.
All settings and stats are stored locally in browser storage.

Details: `PRIVACY_POLICY.md`

### Store submission materials

- `store/GO_LIVE.md`
- `store/CHROME_LISTING_RU.md`
- `store/CHROME_LISTING_EN.md`
