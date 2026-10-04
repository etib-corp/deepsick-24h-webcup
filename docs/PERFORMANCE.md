# Performance — staying fast on low-powered devices

Goal: the main journeys must stay fast and pleasant on throttled / low-powered
devices, without losing essential information or actions. Improvements are
**measured**, not assumed.

## How to measure

- **Per-route client bundles** (webpack):
  ```bash
  ANALYZE=true npx next build   # opens the bundle treemap
  ```
- **First Load JS per route**:
  ```bash
  rm -rf .next && npx next build   # prints a route table with First Load JS
  ```
- **Throttled CPU (Lighthouse)** against a production build:
  ```bash
  npx next build && npx next start &
  npx lighthouse http://localhost:3000/ --preset=perf \
    --throttling.cpuSlowdownMultiplier=4 --output=json --output-path=./lh.json
  ```

## Optimisations applied

1. **Removed anime.js from the shared/root bundle.** `TourProvider` is mounted
   in the root layout and used to import `lib/motion` (which statically imports
   anime.js). It now uses the **Web Animations API** for its ring nudge and a
   local reduced-motion check. anime.js therefore no longer ships on every
   route — only on routes that use `ColonyScene` / `RadarCard`.
2. **CSS-only entrance animations.** `Reveal`, `StatTile`, `FeedRow` and
   `PageHeader` no longer import `lib/motion`; they use `motion-safe:` +
   `tw-animate-css` classes. Three of them became **server components** (no
   client JS), and content stays visible when animations don't run.
3. **Dropped the JS count-up** in `StatTile` (values render instantly).
4. **Polling pauses when the tab is hidden** (`IncidentConsole`), so background
   tabs never re-render the RSC tree.
5. **`content-visibility: auto` + `contain-intrinsic-size`** on feed rows, so
   long lists skip rendering off-screen rows.

## Results — First Load JS (before → after)

| Route | Before | After | Δ |
| --- | ---: | ---: | ---: |
| `/announcements` | 138 kB | 106 kB | **−32 kB** |
| `/citizen/consultations` | 201 kB | 174 kB | **−27 kB** |
| `/citizen/contributions` | 201 kB | 174 kB | **−27 kB** |
| `/citizen/notifications` | 201 kB | 174 kB | **−27 kB** |
| `/citizen/wallet` | 115 kB | 87.4 kB | **−28 kB** |
| `/citizen` | 225 kB | 208 kB | −17 kB |
| `/citizen/appointments` | 218 kB | 202 kB | −16 kB |
| `/citizen/orders` | 222 kB | 206 kB | −16 kB |
| `/citizen/reports` | 217 kB | 201 kB | −16 kB |
| `/citizen/map` | 124 kB | 108 kB | −16 kB |
| `/services` | 143 kB | 126 kB | −17 kB |
| `/council` | 146 kB | 130 kB | −16 kB |
| `/council/users` | 211 kB | 194 kB | −17 kB |
| `/council/services` | 213 kB | 197 kB | −16 kB |
| `/council/announcements` | 219 kB | 203 kB | −16 kB |
| `/council/broadcasts` | 212 kB | 196 kB | −16 kB |
| `/council/consultations` | 219 kB | 203 kB | −16 kB |
| `/operations/administration` | 140 kB | 123 kB | −17 kB |

Typical win: **−16 to −32 kB** of client JS on most routes (the anime.js
removal from components used across the app).

## Notes / next steps

- `/`, `/login` and the ops consoles still include **anime.js** because
  `ColonyScene` and `RadarCard` import it statically. Lazy-loading anime.js in
  those two is the next win.
- The interactive **tutorial** (`TourProvider`) is still mounted globally; code
  splitting it would trim the base bundle further.
- Growing council/agent lists should get **server-side pagination** as volume
  increases; feed rows already skip off-screen work via `content-visibility`.
- Build is flaky on Node 25 (Next 14 `PageNotFoundError` / `.next` race):
  always `rm -rf .next` before `next build`.
