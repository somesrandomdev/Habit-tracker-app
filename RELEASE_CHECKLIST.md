# FastHabit — Release Checklist

Work top-to-bottom before every release. Prerequisites: `npm run typecheck`, `npm run lint`, `npm test` all green.

---

## 1. Pre-flight

- [ ] `npm install` on a clean clone succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` reports 0 errors / 0 warnings
- [ ] `npm test` — all suites pass
- [ ] `npx expo export --platform android` bundles without errors
- [ ] `app.json` sanity: name **FastHabit**, version bumped if needed, `com.fasthabit.app` ids, scheme `fasthabit`
- [ ] Brand assets present and intentional (`assets/images/icon.png`, `splash-icon.png`, `android-icon-foreground.png`, `android-icon-monochrome.png`, `favicon.png`) — regenerate with `node scripts/generate-brand-assets.mjs` if the mark changed

## 2. Real-device testing (Expo Go → then preview build)

- [ ] Install: `npm start`, scan QR with **Expo Go** (Android + iOS if available)
- [ ] **First run:** onboarding completes end-to-end; relaunch lands on Today (not onboarding)
- [ ] **Fasting:** start a fast → kill the app → relaunch: timer continues with correct elapsed time
- [ ] Background the app for 5+ minutes → foreground: ring and remaining time are accurate
- [ ] Extend a fast (+1h): scheduled end moves; ring adjusts; notification rescheduled
- [ ] End fast at target → celebration screen appears; fast recorded `completed`
- [ ] End fast early → reason sheet → recorded `stopped_early`; streak logic holds
- [ ] Cancel fast → recorded `abandoned`
- [ ] **Challenge:** daily check-in; slip/fail shows recovery message; calendar updates; same-day edit works (no duplicates)
- [ ] Challenge end-date rollover: set device clock +1 day past end → reopening marks challenge completed and shows celebration exactly once
- [ ] **Habits:** create daily + custom-schedule habits; toggle complete/undo; detail calendar edits past days
- [ ] Rapid-tap test: double-tap Start Fast / Check-in / Save — no duplicates, no crashes
- [ ] **Dark mode:** toggle in Settings (or system) — every tab readable, especially Insights and calendars
- [ ] Small-screen check (or large-font setting): layouts scroll, nothing clipped

## 3. Notification testing (Android)

> Note: in **Expo Go**, Android local notifications work; remote push does not (by design). Scheduled alerts appear even when the app is closed.

- [ ] Enable notifications during onboarding → OS permission dialog appears; denial keeps the app fully usable with in-app reminder cards
- [ ] Start a fast with "Fast complete" enabled → a system notification is scheduled for the target time (check OS notification settings → app → scheduled)
- [ ] Extend the fast → old scheduled notification replaced (count stays correct)
- [ ] End/abandon the fast → scheduled notification gone
- [ ] Enable daily check-in reminder at 19:00 → one scheduled daily trigger visible in OS settings
- [ ] Add a habit with a reminder time → weekly/daily triggers appear per its schedule
- [ ] Disable every notification category → scheduled list empties

## 4. Data safety testing

- [ ] **Export on empty DB** (fresh install, skip onboarding? not possible — use Reset first): export succeeds, JSON contains empty arrays
- [ ] **Export populated:** load demo data → export → share sheet offers the JSON file
- [ ] **Import round-trip:** reset all → import the backup → all screens match pre-reset state
- [ ] **Import rejects:** paste invalid JSON → friendly error, data unchanged; paste a backup with `"version": 99` → "newer version" error, data unchanged
- [ ] **Reset with active fast + check-ins + habits** → confirmation dialog → everything clears; app returns to blank state without crashing
- [ ] **Demo data after reset** → loads cleanly, no duplicates; charts and streaks populated
- [ ] App killed during export/import → no corrupt state on relaunch (imports are transactional)

## 5. Preview build QA (closer to production)

- [ ] `npm i -g eas-cli && eas login`
- [ ] `eas build:configure` (accepts the existing `eas.json`)
- [ ] Android QA build: `eas build -p android --profile preview` → install the APK on a device
- [ ] Verify on the APK (not Expo Go): notifications schedule/fire with the app closed, icon + splash show FastHabit branding, no dev-menu overlay
- [ ] iOS (needs Apple account): `eas build -p ios --profile preview` → device install via internal distribution link

## 6. Store submission (when ready)

- [ ] `eas build -p android --profile production` → AAB with auto-incremented version code
- [ ] `eas build -p ios --profile production` → IPA
- [ ] Fill store listings from `STORE_LISTING.md` (descriptions, keywords, screenshots per §capture below)
- [ ] Google Play Data Safety form: use the "Privacy considerations summary" in `STORE_LISTING.md` (answer: no data collected/shared)
- [ ] App Privacy (iOS): "Data Not Collected"
- [ ] Health-app review notes: paste the "Review notes for stores" section from `STORE_LISTING.md`
- [ ] `eas submit -p android` / `eas submit -p ios` (after store credentials are configured), or upload manually
- [ ] Tag the release commit (`git tag v1.0.0`) once builds are submitted

## 7. Screenshot capture

- [ ] Load demo data first (Settings → Data management)
- [ ] Capture the 6 shots listed in `STORE_LISTING.md` on a physical device or high-res emulator
- [ ] Light mode for most; at least one dark-mode shot
- [ ] Sizes: 6.7" phone (1290×2796) for App Store; 1080×1920+ for Play
- [ ] No personal data in frame (demo data only)

---

**Known manual-test blind spots (cannot be automated here):** OS permission dialogs, notification firing while the app is killed, store build signing, day-boundary rollovers on real hardware, and low-memory behavior.
