# FastHabit — Manual QA Checklist

Verified against the implementation on 2026-09-28. Re-run after any change to a module marked here.

## Setup

- [ ] `npm install` completes
- [ ] `npm start` boots the Expo dev server; QR code pairs with Expo Go (Android or iOS)

## First run & onboarding

- [ ] First launch shows the onboarding welcome (not the tabs)
- [ ] Step indicator advances 1→9; back navigation preserves selections
- [ ] Goal selection highlights and persists to the summary
- [ ] Safety screen blocks Continue until "I understand" is tapped
- [ ] Fasting plan: preset select works; **Custom** shows hour inputs; invalid hours (≠ 24 total, or out of 1–23) show an error and block Continue
- [ ] Challenge type: custom requires a rules line; presets preview their rules
- [ ] Duration chips update the summary date range (today → today + N − 1)
- [ ] Habits: preset chips toggle, custom habit add/remove works; Continue blocked with none selected
- [ ] Notifications: "Enable" requests OS permission; denial shows the graceful fallback message and still allows Continue
- [ ] Summary shows plan / challenge / habits / reminders; **Start My Journey** lands on the Today tab
- [ ] Killing and reopening the app goes straight to the tabs (onboarding flag persisted)

## Today dashboard

- [ ] Fasting card shows the plan and **Start Fast**; after starting, ring + clock tick every second
- [ ] Remaining time and scheduled end display correctly; phase badge (Early / Fat-Burning / Extended) matches elapsed time
- [ ] Extend opens the modal; +1h moves the scheduled end and the ring adjusts
- [ ] End Fast at/after target routes to the **celebration** screen and records `completed`
- [ ] End Fast before target records `stopped_early` (no celebration)
- [ ] Challenge card shows day N/total, today's check-in badge or "Not checked in", and streak
- [ ] Habit checkboxes toggle instantly, count and progress bar update, second tap undoes
- [ ] Wellness card reflects today's log or the empty prompt; tapping opens the log modal
- [ ] Streak cards match the detail screens; zero values show em-dashes, not crashes
- [ ] Pull-to-refresh re-syncs everything; backgrounding the app for minutes and returning shows fresh values

## Fasting tab

- [ ] Large ring + timer match the dashboard; phase hint text shows
- [ ] **End Fast** before target opens the reason sheet (chips optional) and records `stopped_early` with the chosen reason
- [ ] **Cancel fast** requires confirmation and records `abandoned`
- [ ] **Edit start time** validates the `YYYY-MM-DD HH:MM` format and rejects future times; duration stays constant
- [ ] Notes field saves on blur and survives an app restart
- [ ] Stats row (completed, total hours, average, streak, this week) matches the history data
- [ ] Calendar marks: green = completed, amber = stopped early, gray = abandoned, today outlined; future days unmarked
- [ ] History rows open fast detail; detail shows plan, times, duration, result, reason, notes; **Delete** requires confirm and removes the row
- [ ] Starting a second fast while one is active is blocked with a friendly error

## Challenge tab

- [ ] No-challenge state shows the empty state + **Start a challenge** (also reachable from Home)
- [ ] New-challenge modal: rule set, duration, optional reminder toggle; start creates the challenge with today as day 1
- [ ] Check-in modal: one status selected, craving slider 0–10, trigger chips, note; save updates the card immediately
- [ ] Re-checking-in on the same day **edits** the existing record (no duplicates in calendar/stats)
- [ ] **Slip / fail** shows the recovery message and a warning haptic; current streak resets, day count and prior successes remain
- [ ] Success / craving-only days extend the streak and turn the calendar cell green/teal
- [ ] Rules screen shows the challenge's rules text, check-in legend, today's sugar tip, and coping strategy
- [ ] Abandon requires confirmation; afterwards the empty state offers starting a new challenge
- [ ] When today > end date, the challenge flips to completed and the celebration screen fires once (try: set device date forward one day, reopen)

## Habits tab

- [ ] Today list shows only habits scheduled today; unscheduled habits appear under "Not scheduled today"
- [ ] Quick complete/undo works from the list; duplicate taps are safe
- [ ] Create habit: empty name blocked; custom schedule requires ≥ 1 weekday; reminder requires HH:MM (chips or input)
- [ ] Habit detail: streak stats, calendar marks (green/amber/red), tapping a day opens the status editor
- [ ] Editing a past day to *skipped* preserves the streak; *missed* breaks it; future days can't be marked
- [ ] Editing today: "Completed" behaves like the toggle (second press undoes)
- [ ] Remove habit requires confirmation; the habit disappears from lists while its history remains in stats of the detail (deactivated)
- [ ] Long habit names ellipsize without breaking the row

## Insights tab

- [ ] With no data, sections show friendly empty states instead of blank charts
- [ ] Fasting bars sum completed-fast hours per day (try after completing a fast)
- [ ] Challenge calendar mirrors check-in colors; stats match the challenge tab
- [ ] Habit rates rank best/focus habit; weekday chart reflects the last 14 days
- [ ] Wellness line charts skip unlogged days (gaps, not zeros); water average matches logs
- [ ] Metrics: latest weight/waist shown in the active unit system; switch metric↔imperial in Settings and confirm values convert; 7/30-day change and trend line render
- [ ] Achievements grid: unlocked badges full-opacity, locked dimmed; counts correct

## Achievements

- [ ] Complete a first fast → "First Fast" modal animates in (also from Home or Fasting)
- [ ] Loading demo data (12 completed fasts, 3+ day streaks, challenge progress) unlocks several badges; the queue shows them one after another without blocking the app

## Settings & data

- [ ] Name change reflects on the Today greeting after save
- [ ] Theme system/light/dark applies instantly (dark palette on every screen)
- [ ] Unit switch converts metrics display and re-labels inputs (kg↔lb, cm↔in)
- [ ] Default plan switcher moves "Active" and updates Home's start button label
- [ ] Notification toggles + time chips persist and change scheduled reminders (visible via OS notification settings/scheduled list on device)
- [ ] **Export**: share sheet opens with a `fasthabit-backup-YYYY-MM-DD.json` file; the JSON contains all tables
- [ ] **Import (file)**: pick a previous export → data restored, screens re-hydrated, success message shown; an invalid file shows the validation error and changes nothing
- [ ] **Import (paste)**: pasting a valid backup works; pasting garbage shows a friendly error
- [ ] **Demo data** replaces state with 2 weeks of sample data across all features
- [ ] **Reset all data** requires confirmation, wipes everything, and returns the app to a blank (post-onboarding-complete) state; an active fast at reset time is cleared with it

## Persistence & edge cases

- [ ] Kill the app mid-fast → reopen: timer is still running with correct elapsed time (timestamp math)
- [ ] Airplane mode / no network for a full session: every feature works (local-first)
- [ ] Device timezone change mid-session: active fast elapsed time unchanged; new records use the new local date
- [ ] Rapid double-taps on Start/Check-in/Save never create duplicates
- [ ] Rotation/small screens/large font scale: layouts scroll, nothing clips or overlaps
- [ ] Keyboard opens over inputs without hiding them (modals use keyboard-avoiding views)
