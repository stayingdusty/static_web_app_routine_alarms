# Routine Beacon

Routine Beacon is a dependency-free, static visual routine timer designed for a dedicated tablet. Run Mode deliberately keeps the configured schedule separate from a temporary alarm delay: lateness is always measured against the phase's scheduled time, while the audible alarm may be moved independently.

## Run locally and build

Requires Node.js 18+ only for checks/build (the app itself has no runtime dependencies).

```bash
python3 -m http.server 4173
# open http://localhost:4173
npm test
npm run check
npm run build       # copies the deployable application to dist/
```

Do not open `index.html` directly: a local HTTP server is needed for ES modules, service workers, and wake lock. Alarm sound is on by default. Because browsers require a user gesture before audio can play, the app unlocks audio on the first tap or key press; sound previews in the editor and Settings can also be used to test it.

## GitHub Pages deployment

The application uses only relative URLs, so it works at a repository subpath. Build it and publish the contents of `dist/` from a Pages workflow, or configure Pages to publish the repository root. There is no client-side router and therefore no rewrite configuration.

## Data and backup model

All data is stored as one versioned document in `localStorage` under `routineBeacon.v1`. It contains `schemaVersion`, `appVersion`, routines and phases, the currently viewed routine, preferences, keyboard mappings, and date-and-routine-keyed runtime state. A runtime contains the local calendar date, routine ID, active phase index, checklist state, and effective alarm timestamp. Only one routine may run at a time, and yesterday's state never leaks into today.

**Export settings** downloads that document as a readable JSON backup. **Import settings** parses and validates its schema and routine/phase shape, asks before replacement, then writes it to local storage. JSON is a backup format only; normal editing happens in the Routines and Settings screens.

**Copy share link** creates a URL-safe Base64-encoded link containing the selected routine plus alarm and keyboard preferences. Opening a valid link adds a separate “Shared” copy, selects it, and removes the payload from the address bar. Share URLs require no server, but can become long for large routines and anyone with the link can read its contents; do not put sensitive information in a routine.

## Timing and controls

Each render derives the scheduled transition timestamp from the next phase's `HH:MM` and the browser's current local date. It subtracts `Date.now()` rather than decrementing a counter, so a throttled or sleeping tab catches up correctly. Reaching a time sounds the alarm but never advances the phase. The selected melody repeats with a one-second pause until the alarm is delayed or the routine moves to another phase. Enabling audio after an alarm is already due starts that repeating alarm immediately. Ten built-in Web Audio melodies are generated locally—without downloads, streams, or audio files—and each phase can use a different sound with an in-editor preview.

A routine started manually enters its first configured phase immediately. The active routine uses the routine editor’s weekday checkboxes for automatic starts; routines with no selected days remain manual-only. At the first phase’s start time, the alarm sounds in the background, the app switches to Run Mode, and **Dismiss alarm & start routine** must be acknowledged before the first phase begins.

**Mark complete today** records that the active routine is done without running its phases. Completion suppresses today’s overdue countdown, so the next countdown targets the next enabled day (for a daily 6:00 a.m. routine, that means 6:00 a.m. tomorrow). Completing the final phase does the same thing. Reset Today clears that completion and today’s progress.

Delay (`S`) changes only the current transition's effective alarm. Before it is due, each press adds one minute. When due/sounding, the first press stops the current alarm and sets it to now plus one minute; further presses add a minute. Next (`N`) stops sound and advances. Previous (`P`) returns to the prior transition and restores that transition's alarm delay, making it safe to correct an accidental advance. Alarms cannot be silenced independently. All mappings use `KeyboardEvent.code`, are configurable, and Settings includes a live key/code tester.

Phases may also contain optional required checklist items. Run Mode saves each checked item in today's runtime state and disables both the on-screen Next button and the `N` shortcut until every item in the current phase is checked. Returning with Previous retains the checklist state.

**My Routines** is the operational dashboard rather than an editor. It shows the one active routine, the routine currently being viewed, and current/next phase details. From there a caregiver can view, stop, edit, or **Switch & Start** a routine. Starting a different routine warns that the existing active routine will be stopped and reset; confirming makes the selected routine the sole active routine. This invariant ensures the screen and hardware controls can never progress different routines. Run Mode gives the current and next scheduled times their own prominent strip directly above the countdown.

The application uses a fixed-height shell so the browser page itself never scrolls and the top navigation stays available. Run Mode responsively compresses its panels, countdown, and controls into the available viewport. The current phase card shows its required checklist when one is configured, or its short description otherwise. The separate upcoming-phase card shows only the next phase and its short description, so checklist ownership is unambiguous. Configuration and dashboard content scroll inside the main content region when needed. **Reset today** is always available in the top bar, while routine navigation stays focused on My Routines, Edit, and Settings.

## Browser limitations

- Audio cannot be guaranteed before the first tap or key press; operating systems may still suspend background tabs.
- Screen Wake Lock is requested in Run Mode and reacquired when visible, but is unavailable in some browsers and may be revoked by the OS or low battery.
- PWA installation depends on browser/platform support. The manifest and simple application-shell service worker allow installation and offline reuse after a successful first load.
- `localStorage` belongs to a particular browser/origin and can be erased by browser settings; export backups regularly.
