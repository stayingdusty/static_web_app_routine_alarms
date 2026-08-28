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

Do not open `index.html` directly: a local HTTP server is needed for ES modules, service workers, and wake lock. Audio must be enabled with the in-app button after loading because browsers require a user gesture.

## GitHub Pages deployment

The application uses only relative URLs, so it works at a repository subpath. Build it and publish the contents of `dist/` from a Pages workflow, or configure Pages to publish the repository root. There is no client-side router and therefore no rewrite configuration.

## Data and backup model

All data is stored as one versioned document in `localStorage` under `routineBeacon.v1`. It contains `schemaVersion`, `appVersion`, routines and phases, the currently viewed routine, preferences, keyboard mappings, and date-and-routine-keyed runtime state. A runtime contains the local calendar date, routine ID, active phase index, checklist state, and effective alarm timestamp. Only one routine may run at a time, and yesterday's state never leaks into today.

**Export settings** downloads that document as a readable JSON backup. **Import settings** parses and validates its schema and routine/phase shape, asks before replacement, then writes it to local storage. JSON is a backup format only; normal editing happens in the Routines and Settings screens.

**Copy share link** creates a URL-safe Base64-encoded link containing the selected routine plus alarm and keyboard preferences. Opening a valid link adds a separate “Shared” copy, selects it, and removes the payload from the address bar. Share URLs require no server, but can become long for large routines and anyone with the link can read its contents; do not put sensitive information in a routine.

## Timing and controls

Each render derives the scheduled transition timestamp from the next phase's `HH:MM` and the browser's current local date. It subtracts `Date.now()` rather than decrementing a counter, so a throttled or sleeping tab catches up correctly. Reaching a time sounds the alarm but never advances the phase.

When a routine is first started, the first configured phase is the upcoming transition. This means starting a 2:30 routine at 2:47 correctly shows 17 minutes late. Progressing once makes the second phase the upcoming transition, so a 2:45 second phase then shows 2 minutes late. Each further progression compares the clock with the following phase in sequence.

Delay (`S`) changes only the current transition's effective alarm. Before it is due, each press adds one minute. When due/sounding, the first press silences it and sets it to now plus one minute; further presses add a minute. Next (`N`) stops sound and advances. Previous (`P`) returns to the prior transition and restores that transition's alarm delay and silence state, making it safe to correct an accidental advance. Silence (`D`) stops sound without moving the routine. All mappings use `KeyboardEvent.code`, are configurable, and Settings includes a live key/code tester.

Phases may also contain optional required checklist items. Run Mode saves each checked item in today's runtime state and disables both the on-screen Next button and the `N` shortcut until every item in the current phase is checked. Returning with Previous retains the checklist state.

**My Routines** is the operational dashboard rather than an editor. It shows the one active routine, the routine currently being viewed, and current/next phase details. From there a caregiver can view, stop, edit, or **Switch & Start** a routine. Starting a different routine warns that the existing active routine will be stopped and reset; confirming makes the selected routine the sole active routine. This invariant ensures the screen and hardware controls can never progress different routines. Run Mode gives the current and next scheduled times their own prominent strip directly above the countdown.

The application uses a fixed-height shell so the browser page itself never scrolls and the top navigation stays available. Run Mode responsively compresses its panels, countdown, and controls into the available viewport; exceptionally long checklists scroll only inside their checklist panel. Configuration and dashboard content scroll inside the main content region when needed. **Go Fullscreen** is always available in the top bar and changes to **Exit Fullscreen** while active.

## Browser limitations

- Audio cannot be guaranteed before the user presses **Enable alarm sound**; operating systems may still suspend background tabs.
- Screen Wake Lock is requested in Run Mode and reacquired when visible, but is unavailable in some browsers and may be revoked by the OS or low battery.
- Fullscreen and PWA installation depend on browser/platform support. The manifest and simple application-shell service worker allow installation and offline reuse after a successful first load.
- `localStorage` belongs to a particular browser/origin and can be erased by browser settings; export backups regularly.
