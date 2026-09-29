# FastHabit — Agent Build Report

**Date:** 2026-09-28 · **Stack:** React Native 0.86 · Expo SDK 57 · TypeScript (strict) · Expo Router · Zustand · expo-sqlite · date-fns · zod · react-native-svg · expo-notifications · expo-haptics · Jest + RNTL

## Assumptions made

1. **"fasting streak"** counts consecutive local calendar dates containing a *completed* fast, dated by the fast's **end** time. A fast in progress today does not break the streak (it anchors at yesterday).
2. **Abandoned fasts** are fasts ended within the first **15 minutes** (canceled), or explicitly canceled by the user. They do not count toward any streak or total.
3. **Missed challenge days** (a past day with no check-in) break the current/longest sugar streak and count as "missed" in stats — but never remove prior success days. **Today without a check-in is "pending"**: it neither extends nor breaks the streak and is excluded from the completion-rate denominator until checked in.
4. **Skipped habits** preserve the streak without increasing it; a past scheduled day with no record counts as missed. An unchecked **today** is pending, not broken.
5. **Custom fasting plan** must satisfy `fasting + eating = 24`, each between 1 and 23 hours (validated on the onboarding screen and again in the store).
6. The check-in column the spec calls `trigger` is stored as **`trigger_type`** — `trigger` is a reserved SQLite keyword.
7. `habits` gained an additive **`emoji`** column (not in the spec's field list) for preset/custom habit icons. Additive, backward-compatible.
8. **Challenge completion** flips automatically when today is past `end_date` (checked on every hydration); a one-shot per-challenge settings flag drives the celebration screen so it fires even if the challenge finished while the app was closed.
9. **Achievement thresholds** use *current* streaks (not historical longest) and are evaluated after every relevant mutation; `comeback` = yesterday slip/fail + today qualifying check-in.
10. **Weekly completion rate** for habits uses a rolling **14-day** window (the spec's "weekly" stats interpolate over scheduled days only; 14 days gives stable numbers for weekday schedules).
11. Import accepts a **picked JSON file** (built-in `File.pickFileAsync`) or **pasted JSON**; export writes to cache + OS share sheet. No extra document-picker dependency was needed.
12. Demo data generates ~2 weeks of realistic relative-to-today history so every screen, chart, and celebration can be exercised.

## Features completed (all end-to-end, real persistence)

- ✅ 9-step onboarding (welcome → goal → safety disclaimer → fasting plan → challenge type → duration → habits → notification permission → summary) creating profile, plan, challenge, habits, notification defaults, and onboarding flag in one transaction
- ✅ Home dashboard: live fasting ring, challenge card w/ today's status, today's habits with quick toggle, wellness log card, streak overview, rotating daily quote — pull-to-refresh + foreground refresh
- ✅ Fasting module: start / live timer (1s tick from timestamps) / extend (+1, +2, custom, with re-scheduled notification) / end (completed vs stopped-early confirm + reason sheet) / cancel / correct start time / notes / history / month calendar / full stats
- ✅ Challenge module: active challenge card, day ring, streak, rules screen with tips & coping strategy, check-in modal (status, 0–10 craving slider, triggers, note; same-day edit), status calendar, progress stats, recovery messaging, abandon w/ confirm, start-new modal, completion celebration
- ✅ Habits module: create/edit/deactivate, three schedule types, weekday picker, reminder time, today list, detail screen with calendar + per-day status editor (completed/skipped/missed) + history + streak stats
- ✅ Daily wellness log modal (mood/hunger/energy 1–5, water stepper 0–20, craving 0–10, note) with same-day upsert
- ✅ Metrics modal + insights trends, unit conversion (kg/lb, cm/in) applied at display/entry boundaries, latest-entry logic
- ✅ Insights tab: 5 sections + achievements gallery, custom SVG bar/line charts with empty states, challenge heatmap calendar
- ✅ 11 achievements with global animated unlock modal and persisted unlock timestamps
- ✅ Local notifications: 5 categories, per-category toggles + daily times, weekday-aware habit reminders, fast-end date trigger, full re-sync strategy, graceful denial path
- ✅ Settings: profile name/goal, theme (system/light/dark incl. dark palette everywhere), units, default plan switcher, notification prefs, data management, medical disclaimer, about
- ✅ Data management: validated export/import (zod), reset w/ confirmation, demo data loader
- ✅ 12-table SQLite schema with FKs, indexes, `UNIQUE` business keys, `PRAGMA user_version` migrations, safe reset
- ✅ Edge cases from the spec: midnight-crossing fasts, TZ/DST (pure UTC math), restart/backgrounding (recompute-on-mount), duplicate-tap protection (upserts + store guards), empty/loading/error states everywhere, chart zero-data handling, DB init failure screen, keyboard avoidance, long-name ellipsis, 44pt+ tap targets

## Test summary

**10 suites · 68 tests · all passing** (`npm test`), plus `tsc --noEmit` clean and `eslint src` at 0 errors / 0 warnings.

| Suite | Covers |
|---|---|
| `dates.test.ts` | local-date keys, month rollover, day diffs, ISO→local mapping, plan labels |
| `durations.test.ts` | clock/human formatting, clamping, hour conversions |
| `streaks.test.ts` | current streak (today-or-yesterday anchor, gaps), longest run |
| `fasting.test.ts` | progress math, completion/early/abandon classification (15-min rule), phases, stats aggregation, midnight crossing |
| `challenge.test.ts` | qualifying statuses, day number/totals/rate, slip resets streak but not progress, pending-today grace, finished detection, missed-day runs |
| `habits.test.ts` | schedule types, streak rules (completed/skipped/missed/pending), 14-day scheduled-only rate |
| `metrics.test.ts` | kg/lb + cm/in round trips, latest-entry, 7/30-day change, window filtering |
| `insights.test.ts` | per-day fasting hours, habit ranking, wellness trend gaps, service surface + duration bounds |
| `validation.test.ts` | backup schema accepts valid / rejects bad JSON, wrong marker, malformed dates (with path), missing tables |
| `components.test.tsx` | AppText render + variant sizing; AppButton press handling + disabled state |

Restart-persistence behavior is covered at the logic level: the timer is a pure function of stored timestamps (asserted under simulated restart/background in `fasting.test.ts`), and stores re-hydrate from SQLite on boot and foreground.

## Verification performed

- `npx tsc --noEmit` → clean
- `npx eslint src` → 0 errors, 0 warnings (flat config, `eslint-config-expo`)
- `npm test` → 68/68 passing
- `npx expo export --platform android` → full Metro/Hermes production bundle compiles with no broken imports or dead routes (all 26 route files resolve)
- Manual code-path review of every route, store action, and edge-case listed in the spec's §11

## Future improvements

1. ICLOUD/Google Drive backup targets instead of share-sheet JSON
2. Weight-goal projections and fasting-window scheduling (start reminder tied to plan)
3. Richer notification actions ("Start fast" / "Check in" from the notification)
4. Optional HealthKit / Health Connect sync for weight & sleep
5. Localization layer on top of the centralized content modules

---

# Release-Candidate Phase (2026-09-28, second pass)

The MVP above was hardened toward store readiness **without rewriting** any module. Everything below extends or patches the existing architecture.

## What changed in this phase

**Branding (no more template assets)**
- New brand mark designed as SVG and rasterized with `sharp`: amber fasting-progress ring around a white crescent moon on a deep-teal (`#0F766E`) ground; generated `icon.png` (1024²), Android adaptive `foreground` + `monochrome` (1024², safe-zone scaled), `splash-icon.png` (768², transparent), `favicon.png` (48²).
- `scripts/generate-brand-assets.mjs` regenerates everything from one source file; template assets (`android-icon-background.png`, Expo logos) removed from config.
- Splash background `#0F766E`, `imageWidth: 140`, adaptive-icon background switched from template light-blue to brand teal, `expo-notifications` config plugin added with brand accent color.

**App config**
- Verified: name/slug/scheme/version/ids (`com.fasthabit.app`), portrait, automatic UI style; validated with `npx expo config --type public`.
- Plugin list: router, splash-screen, notifications (brand color), sqlite, sharing, datetimepicker — nothing else; no extra Android permissions requested beyond library defaults.

**EAS**
- `eas.json` with `development` (dev client, internal), `preview` (internal, Android **APK** for sideload QA), `production` (auto-increment, channel `production`); `submit.production` stub. Commands documented in README.

**Runtime hardening**
- Fixed a real regression: the init-error screen's Retry button called `refreshAll`, which now early-returns when `initError` is set → Retry was a no-op. It now re-runs `bootstrap` (idempotent).
- `refreshAll` also refuses to run while an init error is pending, preventing the repeated uncaught `openDatabaseSync` throws seen in the console on web.
- Added `automaticallyAdjustKeyboardInsets` + `keyboardShouldPersistTaps` to every form ScrollView (check-in, wellness, metrics, habit form, new challenge, data management) for iOS keyboard avoidance; Android relies on the default `resize` mode.

**Data safety**
- `parseBackup` now rejects non-FastHabit exports by name and **backups from newer schema versions** (`version > SCHEMA_VERSION`) with clear messages — both before any data is touched. Two new tests cover the rejection paths.

**Performance**
- `ProgressRing`, `BarChart`, `LineChart`, `CalendarMonthView` wrapped in `React.memo`.
- Extracted `TodayFastingCard` (`components/fasting/`): the dashboard's 1-second timer now re-renders only the fasting card, not the whole Today screen.

**Accessibility**
- Bar/line charts expose `accessibilityRole="image"` with data summaries (values read out); `ProgressRing` exposes `progressbar` role + value.
- Light-palette `textFaint` darkened `#8B9A98 → #667876` for contrast on white surfaces.

**Compliance**
- Settings → About now carries a full privacy statement (local-first, no analytics/tracking/network), a responsible-use note, and the version block.
- `STORE_LISTING.md`: store names, short/full description (medical disclaimer included), keywords, category, screenshot plan, data-safety form answers ("no data collected/shared"), reviewer notes.
- `RELEASE_CHECKLIST.md`: end-to-end pre-flight, device QA, notification, data-safety, preview-build, submission, and screenshot-capture steps.

## Assumptions made (this phase)

1. Brand mark kept deliberately simple (ring + moon) so it stays legible at 48 px; palette matches the app theme rather than introducing a second one.
2. `preview` profile builds an Android APK (not AAB) because sideloading an APK is the lowest-friction internal QA loop; production still builds AAB.
3. EAS `autoIncrement` is enabled on production; the human-readable `version` stays hand-managed at `1.0.0` until submission.
4. Store copy makes no medical claims and positions the app as a tracker/motivation tool — reviewed against the in-app safety language.
5. Notifications config plugin added with `mode: "broadcast"` (default-safe for local notifications in dev builds).

## Issues fixed (this phase)

1. Retry-on-init-error no-op (regression introduced by the previous phase's focus guard).
2. Repeated uncaught `openDatabaseSync` throws on web after a failed bootstrap (refreshAll guard).
3. Duplicate `keyboardShouldPersistTaps` props from a scripted edit (caught in review of the diff).
4. iOS keyboards could cover inputs in form modals (keyboard-inset handling added).
5. Whole-dashboard re-render every second while a fast runs (timer scoped to `TodayFastingCard`).

## Remaining risks

- **Notification permission strings on iOS** are handled by the OS dialog; no `infoPlist` keys are required for local notifications, but a marketing build may want `NSUserNotificationsUsageDescription`-style copy in listing text (done in store listing).
- **Store signing** (`eas credentials`) not yet run — needs an Expo/Apple account; first `eas build` will prompt.
- **Timezone-change mid-fast** is handled by UTC math, but a device timezone change mid-*day* can shift local-date keys for *new* records (documented; test on device if targeting travelers).
- **Large habit histories** (months of data) untested on low-end hardware; the 60-day completion window keeps queries bounded, but Insights loads all-time data.
- **Web** remains a best-effort preview behind the dev proxy (embedded browser panes cannot grant cross-origin isolation).

## Manual QA still recommended

Everything in `RELEASE_CHECKLIST.md` §2–§5 — especially: kill-and-relaunch during an active fast on a **preview build** (not Expo Go), notification firing with the app killed, day-rollover celebration firing exactly once, and the store data-safety review on a real build.

## Next steps for store publishing

1. `npm i -g eas-cli && eas login`
2. `eas build:configure` → verify it accepts `eas.json` unchanged
3. Run `RELEASE_CHECKLIST.md` §5 on a real Android device with the preview APK
4. Generate final screenshots (`STORE_LISTING.md` §screenshots, demo data loaded)
5. Production builds → store-console setup (Data Safety / App Privacy answers are in `STORE_LISTING.md`) → submit
6. Tag `v1.0.0`
