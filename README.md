# FastHabit ⏱️🍬✅

A beginner-friendly, offline-first mobile app that combines **intermittent fasting tracking**, a **no-sugar challenge**, and **daily habit building** — with streaks, insights, achievements, and recovery-focused messaging that never shames you for a slip.

Built with **React Native + Expo (SDK 57) + TypeScript**. Local-first: no account, no backend, all data in on-device SQLite. Works fully offline.

---

## Features

- **Fasting tracker** — 14:10 / 16:8 / 18:6 / 20:4 / OMAD / custom plans, timestamp-based timer (survives restarts, backgrounding, timezone & DST changes), extend fast (+1h/+2h/custom), correct start time, notes, stop-early with optional reason, abandon, history, calendar, and full stats (total hours, average, current/longest streak, weekly hours).
- **No-sugar challenge** — no-added-sugar / strict / custom rule sets, 7–60 day durations, one check-in per day (success / craving-only / slip / fail), craving intensity + trigger + note, streak logic where a slip resets the streak but **never erases challenge progress**, recovery messaging, completion celebration.
- **Habit builder** — daily / weekdays / custom schedules, optional per-habit reminders, quick complete + undo, skipped preserves streak, missed breaks it, habit detail with calendar, per-weekday consistency, and full stats. Habits are deactivated (never hard-deleted) so history stays intact.
- **Daily wellness log** — mood / hunger / energy (1–5), water cups (0–20), craving intensity (0–10), one record per local date.
- **Body metrics** — weight / waist / body-fat, metric ⇄ imperial units, latest value + 7/30-day change, trend chart.
- **Insights** — fasting bar chart (7 days), challenge status calendar, habit completion rates + best/focus habit, weekday consistency chart, mood/energy/hunger/craving trends, water average, weight trend line, achievements gallery. Built on custom `react-native-svg` charts (no heavy chart libraries).
- **Achievements** — 11 local badges (first fast, 3/7-day fast streak, sugar streaks, 30/100 fasting hours, perfect day, challenge finisher, comeback kid…) with a global celebration modal.
- **Notifications** — fast-end alert, fasting start / check-in / wellness daily reminders, per-habit weekday-aware reminders. Permission-denied path degrades gracefully to in-app cards. The schedule is rebuilt from data on every relevant change and on foreground.
- **Settings & data** — theme (system/light/dark), units, default plan, per-category notification toggles + times, JSON export (share sheet), JSON import (file picker or paste, zod-validated), full reset, and a rich **demo data loader**.

## Quick start

```bash
npm install
npm start          # Expo dev server — scan the QR code with Expo Go
```

- **Android / iOS:** install [Expo Go](https://expo.dev/go), then scan the QR code from `npm start`.
- **Web:** run `npm start` plus `node scripts/web-proxy.js`, then open **http://localhost:3000**. The proxy injects the COOP/COEP headers that web SQLite needs for `SharedArrayBuffer` (the Expo dev server itself only applies them to bundle requests, not the app's HTML document). Opening port 8081 directly in a browser shows a friendly database error instead.
- **Release QA:** see `RELEASE_CHECKLIST.md` for the full device/notification/data/store checklist.

## Scripts

| Script | Command | Purpose |
|---|---|---|
| `npm start` | `expo start` | Dev server |
| `npm run android` / `ios` / `web` | `expo start --…` | Platform launches |
| `npm run lint` | `expo lint` | ESLint (flat config, `eslint-config-expo`) |
| `npm run typecheck` | `tsc --noEmit` | Strict TypeScript check |
| `npm test` | `jest` | Jest + jest-expo + React Native Testing Library |
| `node scripts/generate-brand-assets.mjs` | — | Regenerates icon/splash/adaptive PNGs from the SVG brand mark (requires `sharp`, a dev dependency) |
| `node scripts/web-proxy.js` | — | COOP/COEP header proxy for web SQLite testing on port 3000 |

All three quality gates currently pass: **typecheck ✓ · lint (0 errors, 0 warnings) ✓ · 68 tests ✓**, plus a clean Metro production bundle (`npx expo export --platform android`).

## Branding

All brand assets are generated from one SVG mark in `scripts/generate-brand-assets.mjs`: a fasting progress ring (amber arc) around a crescent moon on a deep-teal ground. Palette: primary `#0F766E` (deep teal), accent `#F59E0B` (warm amber), plus the app's light/dark palettes in `src/theme/palette.ts`. Generated outputs live in `assets/images/` (app icon, Android adaptive foreground + monochrome, splash icon, favicon). Regenerate after any brand change:

```bash
node scripts/generate-brand-assets.mjs
```

## Release & EAS builds

`eas.json` defines three profiles:

| Profile | Purpose | Notes |
|---|---|---|
| `development` | Dev-client testing | `developmentClient: true`, internal distribution |
| `preview` | Internal QA builds | Android builds an installable **APK** |
| `production` | Store submission | `autoIncrement: true` bumps build numbers |

```bash
npm i -g eas-cli
eas login                      # free Expo account
eas build:configure            # accepts the existing eas.json

# QA builds
eas build -p android --profile preview     # APK you can sideload
eas build -p ios --profile preview         # internal distribution

# Store submission builds
eas build -p android --profile production  # AAB
eas build -p ios --profile production      # IPA
```

Before submitting: work through **RELEASE_CHECKLIST.md** (device QA, notification tests, backup/import tests, screenshot capture) and use **STORE_LISTING.md** for store metadata and data-safety form answers.

## Architecture

```
src/
  app/                  # Expo Router routes
    (onboarding)/       # 9-step first-run flow
    (tabs)/             # Today · Fasting · Challenge · Habits · Insights
    modals/             # check-in, wellness-log, metrics-log, extend-fast, new-challenge
    settings, data-management, habit-form, habit-detail,
    fast-detail, challenge-rules, celebration, +not-found
  components/
    ui/                 # AppButton, AppCard, ProgressRing, BarChart, LineChart,
                        # CalendarMonthView, ModalSheet, StatCard, EmptyState, …
    common/             # ConfirmDialog, global AchievementModal
  features/             # per-feature compositions (OnboardingShell, insights snapshot)
  services/             # business logic (fasting, challenge, habit, wellness,
                        # streak, achievements, notifications, backup, demo,
                        # onboarding, content) — no SQL
  repositories/         # the ONLY layer that touches SQLite
  stores/               # Zustand stores; DB is source of truth, stores hydrate from repos
  hooks/                # useActiveFast, useChallengeProgress, useTodayHabits,
                        # useStreaks, useAppStateRefresh, useTheme, …
  utils/                # pure, unit-tested logic: dates, durations, fasting,
                        # streaks, challengeLogic, habitLogic, metrics, insights, validation
  db/                   # expo-sqlite connection + versioned migrations (PRAGMA user_version)
  theme/ content/ constants/ types/ __tests__/
```

**Rules enforced throughout:** components never contain SQL; all DB access goes through repositories; business rules live in services and pure utils (the tested ones); Zustand stores hydrate from the DB and re-hydrate on foreground (`useAppStateRefresh`); timestamps are stored as UTC ISO strings while calendar-day records use local `YYYY-MM-DD` keys.

## Key design decisions

- **Timestamp-based timer math.** Elapsed/remaining are always `now − start` / `scheduled_end − now`, never accumulated intervals — so restarts, backgrounding, timezone changes and DST cannot corrupt a running fast.
- **Statuses.** Ending at/after the target ⇒ `completed` (counts toward streaks); ending earlier ⇒ `stopped_early`; ending within 15 minutes ⇒ `abandoned`. Fasting streaks count consecutive local dates of completed-fast *end* times.
- **Recovery over shame.** A slip/fail resets the sugar streak only; challenge progress, check-in history, and stats are never erased, and the app shows a supportive recovery message immediately after.
- **Upsert-by-natural-key.** One check-in per challenge per day, one habit record per habit per day, one daily log per date — enforced by `UNIQUE` constraints and `ON CONFLICT DO UPDATE`, so duplicate taps are harmless.
- **Notification re-sync.** Instead of tracking individual notification ids, the whole local schedule is cancelled + rebuilt from current data (prefs, active fast, habits) after every relevant mutation and on app foreground.
- **Versioned schema.** `PRAGMA user_version` + ordered migration list; safe to extend.

## Known limitations

- **Web is secondary (alpha).** Web runs as an SPA (`web.output: "single"` — SSR is disabled because the server-render pass cannot bundle expo-sqlite's web worker, see expo/expo#49032). Expo marks expo-sqlite web support alpha; it requires cross-origin isolation (the dev proxy in `scripts/web-proxy.js` provides it), which embedded browser panes don't grant. Native (Expo Go / dev build) is the real target.
- **Expo Go on Android cannot receive *remote* push** (removed by Expo in SDK 53), and importing the `expo-notifications` package index throws there at import time. This app imports the notification **submodules directly** (`src/services/notifications.service.ts`), so **local notifications keep working in Expo Go**; only remote-push APIs are unavailable (never used). For push/production, use a [development build](https://docs.expo.dev/develop/development-builds/introduction/).
- **Import path:** exports use the OS share sheet; imports accept a picked JSON file or pasted JSON. There is no cloud sync (by design, local-first).
- **Local date keys** use the device timezone at write time; changing device timezone affects which "day" new records land in (historical records and active-fast math are unaffected).
- **Fasting-start reminder** is a fixed daily time chosen in Settings, not tied to a repeating plan schedule.
- **OMAD/extended plans** reuse the same phase labels (early < 12h, fat-burning 12–24h, extended 24h+).
