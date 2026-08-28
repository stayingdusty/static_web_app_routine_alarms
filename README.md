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

All data is stored as one versioned document in `localStorage` under `routineBeacon.v1`. It contains `schemaVersion`, `appVersion`, routines and phases, active routine, preferences, keyboard mappings, and runtime state. Runtime state contains the local calendar date, routine ID, active phase index, and the effective alarm timestamp. A date or active-routine mismatch creates a fresh run, preventing yesterday's snooze from leaking into today.

**Export settings** downloads that document as a readable JSON backup. **Import settings** parses and validates its schema and routine/phase shape, asks before replacement, then writes it to local storage. JSON is a backup format only; normal editing happens in the Routines and Settings screens.

## Timing and controls

Each render derives the scheduled transition timestamp from the next phase's `HH:MM` and the browser's current local date. It subtracts `Date.now()` rather than decrementing a counter, so a throttled or sleeping tab catches up correctly. Reaching a time sounds the alarm but never advances the phase.

Delay (`S`) changes only the current transition's effective alarm. Before it is due, each press adds one minute. When due/sounding, the first press silences it and sets it to now plus one minute; further presses add a minute. Next (`N`) stops sound, advances, and clears that delay. Silence (`D`) stops sound without moving the routine. Mappings use `KeyboardEvent.code`, are configurable, and Settings includes a live key/code tester.

## Browser limitations

- Audio cannot be guaranteed before the user presses **Enable alarm sound**; operating systems may still suspend background tabs.
- Screen Wake Lock is requested in Run Mode and reacquired when visible, but is unavailable in some browsers and may be revoked by the OS or low battery.
- Fullscreen and PWA installation depend on browser/platform support. The manifest and simple application-shell service worker allow installation and offline reuse after a successful first load.
- `localStorage` belongs to a particular browser/origin and can be erased by browser settings; export backups regularly.
