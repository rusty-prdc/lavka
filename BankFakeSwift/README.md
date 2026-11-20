# BankFake 2.5 — SwiftUI

Полная копия BankFake на SwiftUI: баланс, карты, переводы, платежи, история,
профиль, XPRODC ID и админ-панель X-8. Оформление — Liquid Glass (iOS 26),
с автоматическим откатом на `.ultraThinMaterial` на более старых iOS и SDK.

## Экраны

- **Главная** — баланс, быстрые действия, карточки, последние операции.
- **Платежи** — ЖКХ, связь, интернет, транспорт, штрафы, кафе, Лавка, благотворительность.
- **История** — поиск, фильтры по категориям, группировка по дням.
- **Карты** — список, реквизиты, заморозка, выпуск новой, перевод между картами.
- **Профиль** — XPRODC ID, настройки темы/уведомлений/звука/скрытия баланса,
  админ-панель X-8 (видна при X-ID = `X-8`), сброс данных.

Данные хранятся локально в `Documents/bankfake.json`, при первом запуске
подставляются демо-данные.

## Требования

- Xcode 16 или новее (для настоящего Liquid Glass нужен Xcode 26 / iOS 26 SDK).
- iOS 17+ на устройстве.
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) для генерации проекта:
  `brew install xcodegen`.

## Сборка локально

```bash
cd BankFakeSwift
xcodegen generate
open BankFake.xcodeproj
```

Или без XcodeGen: создайте в Xcode новый iOS App (SwiftUI, BankFake) и перетащите
папку `Sources` в проект.

## IPA через GitHub Actions

Workflow `.github/workflows/build-ipa.yml` собирает неподписанный IPA на macOS-раннере
и выкладывает его артефактом:

1. Запушьте изменения в ветку `main` (или запустите workflow вручную: Actions → Build IPA → Run workflow).
2. Откройте Actions → Build IPA → последний запуск.
3. Скачайте артефакт **BankFake-2.5-unsigned-ipa** — внутри `BankFake-2.5-unsigned.ipa`.

Неподписанный IPA ставится через Sideloadly, AltStore или Xcode (нужен свой Apple ID
и профиль подписи). Для публичного репозитория минуты macOS-раннера бесплатны.

## Структура

```
BankFakeSwift/
  project.yml                 — проект XcodeGen
  Sources/
    App/BankFakeApp.swift
    Models/Models.swift       — карты, операции, пользователь, настройки
    Store/BankStore.swift     — состояние, JSON-хранилище, операции
    Design/Theme.swift        — палитра, форматирование, фон
    Design/Glass.swift        — Liquid Glass + откат на материал
    Views/RootView.swift      — таб-бар
    Views/HomeView.swift
    Views/CardsView.swift
    Views/PaymentsView.swift
    Views/HistoryView.swift
    Views/ProfileView.swift   — профиль, XPRODC ID, админка X-8
    Views/TransferView.swift  — перевод и пополнение
```
