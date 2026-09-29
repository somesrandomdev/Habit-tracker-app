# FastHabit — Store Listing Draft

Working metadata for Google Play and the App Store. Copy is original, health-app safe, and free of medical claims.

---

## App identity

| Field | Value |
|---|---|
| App name | FastHabit: Fasting & Habits |
| Package / Bundle ID | `com.fasthabit.app` |
| Version | 1.0.0 |
| Category | **Health & Fitness** (both stores) |
| Content rating | Everyone / 4+ |
| Contains ads | No |
| In-app purchases | No |
| Data sharing | None |

## Short description (≤ 80 chars)

> Track intermittent fasting, beat sugar cravings, and build daily habits — privately.

## Full description

FastHabit brings three pillars of a healthier routine into one calm, offline app:

⏱️ **INTERMITTENT FASTING**
Start a fast with one tap and watch a live progress ring count toward your target. Choose a proven plan (14:10, 16:8, 18:6, 20:4, OMAD) or build your own. Extend, end early, or correct your start time — your timer is always accurate, even after a restart or timezone change.

🍬 **NO-SUGAR CHALLENGE**
Run a 7–60 day challenge with daily check-ins. Log wins, cravings, and slips honestly — a slip resets your streak but never erases your progress. Recovery-focused messages help you bounce back without guilt.

✅ **DAILY HABITS**
Stack supporting habits like drinking water, walking, or skipping late-night snacks. Flexible schedules, gentle reminders, streaks that reward consistency over perfection.

📊 **INSIGHTS THAT MAKE SENSE**
Clean charts show fasting hours, challenge consistency, habit trends, mood, energy, cravings, and weight — all computed on your device.

🔒 **PRIVATE BY DESIGN**
No account. No ads. No tracking. No internet required. Everything stays on your device, with one-tap JSON backup and restore.

💚 **BUILT KIND**
FastHabit is a tracking tool, not a diet plan. It never pushes extreme fasting and always supports getting back on track after a slip.

Highlights: works fully offline · light & dark mode · reminders you control · achievements and celebrations · demo data to explore safely.

**Please note:** FastHabit is not medical advice. If you are pregnant, under 18, managing a medical condition, or have a history of eating disorders, consult a healthcare professional before fasting.

## Keywords (Google Play, ≤ 100 chars)

`intermittent fasting, sugar free, habit tracker, water reminder, streak, wellness, clean eating`

## Suggested screenshots (6)

1. Today dashboard — live fasting ring + challenge card (light)
2. Fasting tab — large ring with phase badge and stats
3. Challenge tab — day ring, streak, and status calendar
4. Habits tab — today's list with quick complete
5. Insights — fasting hours bar chart + habit consistency
6. Settings or celebration screen — dark mode

Capture at 6.7" (1290×2796) and 5.5" (1080×1920 or 1080×2340) for Android; use the demo-data loader first so screens look alive.

## Privacy considerations summary (data-safety forms)

- **Data collected:** none. No analytics, no ads, no crash reporting service, no account.
- **Data shared:** none, unless the user explicitly exports/shares a backup file via the OS share sheet.
- **Data storage:** local SQLite on device only.
- **Permissions:** notifications (user-requested, optional) for fasting/reminder alerts. No location, camera, microphone, or contacts.
- **Account deletion:** not applicable — no accounts exist.
- **Health data handling:** wellness logs (mood/hunger/energy/water/cravings) and body metrics (weight/waist/body-fat) are user-entered and stored on-device only; they are never transmitted.

## Review notes for stores

- The app includes a safety disclaimer during onboarding and in Settings (medical disclaimer + "not medical advice").
- Notification permission is requested during onboarding with an explanation, and the app works fully when denied.
- All features work offline; no backend exists.
