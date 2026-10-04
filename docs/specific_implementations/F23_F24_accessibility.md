# F23 / F24 — accessibility and readability

Verified on 2026-10-03. Changes are limited to presentation and shared UI;
no dependencies were added to the project.

## Architecture reviewed before editing

- Next.js 14 App Router and React 18, with server-rendered pages and client forms.
- Tailwind CSS v4; theme tokens and global styles in `app/globals.css`.
- Ten persistent themes through next-themes; Mars Civic OS is the default.
- Local shadcn/Radix primitives in `components/shadcn`, wrapped by `components/ui`.
- Public header/footer, authentication layout, and the shared `ConsoleShell` for
  citizen, operations and council pages.
- Existing responsive grids, intrinsic card heights, mostly rem-based spacing,
  localized status labels, labelled fields and reduced-motion support.
- Browser zoom was already enabled. A separate text-size preference is unnecessary.

## F23 findings and corrections

The initial axe-core contrast audit found the following examples:

| Theme / element | Initial ratio | Required ratio |
| --- | --- | --- |
| Mars Civic OS: open report badge | 3.95:1 | 4.5:1 |
| Paper Terminal: information badge | 3.58:1 | 4.5:1 |
| Light themes: warning badge | 2.96:1 | 4.5:1 |
| Light themes: success badge | 3.31:1 | 4.5:1 |
| Paper Terminal: nominal colony indicator | 2.15:1 | 4.5:1 |
| Grand Jour: nominal colony indicator | 4.14:1 | 4.5:1 |

- `app/globals.css`: adjust failing primary, information, destructive and chart
  tokens while retaining each theme's hue; improve secondary text in Mars Civic
  OS; strengthen editable-field borders and add a common keyboard focus outline.
- `components/ui/Badge.tsx`: darken success and warning text in light themes.
- `components/shadcn/button.tsx`: keep primary-button hover backgrounds opaque.
- `components/colony/ConsoleShell.tsx`: use the destructive foreground token for
  notification counters; underline active navigation and expose `aria-current`.
- `components/layout/PublicHeader.tsx`: expose the active desktop navigation item.
- `components/colony/IncidentConsole.tsx`: expose selected filters with
  `aria-pressed`; a shared underline supplements their color.

Statuses and priorities already include localized text, and theme selections
already include check marks. These existing cues remain intact.

## F24 findings and corrections

At 320 CSS px with a 200% root text size, the initial dashboards overflowed:
578 px for the citizen page and 480 px for security and council. Feed titles,
metadata and tile hints were also truncated.

- `app/globals.css`: replace legacy 9–11 px utility sizes centrally with 0.75rem;
  let form fields follow the user's text size; wrap long text, menu descriptions
  and card hints; expand clamped card descriptions; bound popup widths; collapse
  narrow console grids; avoid sticky headers consuming a narrow viewport.
- `components/shadcn/button.tsx` and `badge.tsx`: use intrinsic height, minimum
  height and wrapping labels instead of fixed height and nowrap/clipping.
- `components/colony/FeedRow.tsx`: wrap titles, metadata, trailing badges and
  section actions rather than truncating or forcing everything onto one line.
- `components/colony/ConsoleShell.tsx`, `StatusStrip.tsx` and
  `components/layout/PublicHeader.tsx`: let navigation and header content wrap.
- `components/colony/ColonyMap.tsx`: move descriptive text into document flow;
  keep the map's proportional artwork and hotspot coordinates intact.

## Verification

Chrome was driven with temporary Playwright and axe-core installations outside
this repository. No package manifest or lockfile changed.

- 19 pages checked in development and again on the production build: home,
  services and service detail, announcements, contact, login, register,
  appearance, citizen dashboard/report/reports/orders/wallet/notifications,
  security console, council overview/services/users/announcements.
- All 19 returned HTTP 200, with no uncaught browser errors or detected text
  contrast violations in Mars Civic OS.
- All 19 were checked at widths 1280, 640 and 320 CSS px with 16 px and 32 px
  root font sizes. No horizontal document overflow or clipped text was detected.
- Home checked across all ten themes; invalid-login alerts and the citizen
  dashboard also checked across all ten. No detected text contrast violations.
- Real Chrome page zoom at 200% and 400% checked on home, services, contact,
  login, register and the citizen dashboard. A 1280 px browser window yielded
  640 / 320 CSS px with DPR 2 / 4 respectively. No horizontal overflow.
- Demo citizen, security and council sign-in; mobile menu; service map/list
  switching; desktop and enlarged mobile screenshots checked.
- `npx --no-install tsc --noEmit`, `npm run build` and `git diff --check` passed.
- No lint or test script is defined; the Next.js build explicitly skips linting.

These targeted checks are not a full WCAG certification. Text embedded in the
map illustration remains a graphic; the HTML service list and service details
provide readable, scalable equivalents. Mutating business workflows were not
replayed during this presentation-only audit.

References: [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
[text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html),
[reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
