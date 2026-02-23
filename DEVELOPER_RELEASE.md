# BrainFlow Developer Release Guide

[Русский](#русский) | [English](#english)

## Русский

Этот документ для разработчика/паблишера.
Обычным пользователям нужен только `README.md`.

### 1. Авто-проверка перед релизом

```bash
node tools/release-check.js
```

Проверяет ключевые файлы, `manifest.json`, разрешения и иконки.

### 2. Ручной QA чеклист

Используйте:

- `RELEASE_CHECKLIST.md`

### 3. Сборка ZIP для Chrome Web Store

Из корня проекта:

```bash
zip -r BrainFlow-v1.0.0.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

### 4. Материалы для публикации

- Общий go-live план: `store/GO_LIVE.md`
- Тексты карточки (RU): `store/CHROME_LISTING_RU.md`
- Тексты карточки (EN): `store/CHROME_LISTING_EN.md`
- Политика конфиденциальности: `PRIVACY_POLICY.md`

### 5. Safari конвертация

```bash
xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
```

Далее: Xcode проект, подпись, сборка, включение расширения в Safari.

## English

This document is for the developer/publisher.
End users only need `README.md`.

### 1. Automated pre-release check

```bash
node tools/release-check.js
```

Validates required files, `manifest.json`, permissions, and icons.

### 2. Manual QA checklist

Use:

- `RELEASE_CHECKLIST.md`

### 3. Build ZIP for Chrome Web Store

From project root:

```bash
zip -r BrainFlow-v1.0.0.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

### 4. Publishing materials

- Go-live plan: `store/GO_LIVE.md`
- Store listing text (RU): `store/CHROME_LISTING_RU.md`
- Store listing text (EN): `store/CHROME_LISTING_EN.md`
- Privacy policy: `PRIVACY_POLICY.md`

### 5. Safari conversion

```bash
xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
```

Then continue in Xcode: signing, build, and enable extension in Safari.
