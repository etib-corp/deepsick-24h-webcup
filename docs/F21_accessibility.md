# F21 — screen reader accessibility

Reviewed and implemented on 2026-10-03. Changes are limited to rendered UI,
semantics and localized accessibility text. No package dependency was added.

## Analysis before editing

The application uses Next.js 14 App Router, React 18, Tailwind v4 and local
shadcn/Radix primitives. The public shell and `ConsoleShell` provide navigation;
the authentication layout presents login/registration. Citizen forms use shared
`Field`, `Input`, `Select`, `Textarea`, `Button` and `Alert` wrappers.

Already correct:

- Native buttons, links and form controls; visible labels associated with citizen
  form controls using `htmlFor`/`id`, or wrapping radio/checkbox labels.
- Radio groups use `fieldset` and `legend`; required, email and minimum-length
  constraints use native browser validation.
- Principal pages have one h1 and a logical heading hierarchy; public sections
  and service/announcement details already use h2/h3 as appropriate.
- Decorative colony scenes are hidden from assistive technology. Map artwork has
  an empty alt; its named links and the HTML services list provide the content.
  Radar SVGs have image roles and names, with meaningful status text nearby.
- Icon-only theme, language and notification controls already have names.
- Radix supplies menu keyboard navigation, focus management and Escape behavior.
- Next.js supplies route announcements; existing focus-ring styles are retained.

Real gaps:

- Login/registration lacked a main landmark; repeated navigation had no skip link.
- Field hints were visible but not associated with controls.
- The mobile disclosure did not expose expanded state or support Escape; current
  navigation needed explicit identification. The console logo became unnamed
  when its text was hidden on mobile.
- Current theme/language choices were indicated by check icons without exposing
  their selected state. Repeated gallery buttons only said “Apply”.
- Account-role selectors and the shared order-status selector had no labels.
- Read/unread notification states relied on symbols.
- All feedback used an assertive alert, including nonurgent confirmations. The
  contact confirmation replaced the form and lost its focused submit control.

## Exact files changed

| File | Reason |
| --- | --- |
| `app/(auth)/layout.tsx` | Main landmark and skip-link target for login/registration; authentication logic is untouched. |
| `app/(public)/layout.tsx` | Focusable main target for the public skip link. |
| `components/layout/SkipLink.tsx` | One shared, localized native anchor visible on keyboard focus. |
| `components/layout/PublicHeader.tsx` | Named desktop/mobile navigation; current page; disclosure state and Escape focus return. |
| `components/colony/ConsoleShell.tsx` | Shared skip link/target, named mobile logo/navigation and one most-specific current page. |
| `components/ui/Field.tsx` | Connect hints centrally to matching controls via aria-describedby, preserving caller descriptions; require htmlFor. |
| `components/ui/Alert.tsx` | Alert for errors, status for other feedback; atomic message; opt-in focus when replacing a form. |
| `components/forms/ContactForm.tsx` | Focus the success confirmation, including its reference, after the form disappears. |
| `components/layout/ThemePicker.tsx` | Existing Radix radio menu items expose current selection and retain keyboard behavior. |
| `components/i18n/LocaleSwitcher.tsx` | Existing Radix radio menu items expose current language selection. |
| `components/theme/ThemeGallery.tsx` | Include the theme name in each application button's accessible name. |
| `components/colony/OrderStatusForm.tsx` | Name the shared inline status selector. |
| `app/council/users/page.tsx` | Name each role selector with its account context. |
| `app/citizen/notifications/page.tsx` | Add screen-reader text for read/unread state while keeping the visible symbols. |
| `lib/i18n/dictionaries/fr.ts` | French accessibility labels. |
| `lib/i18n/dictionaries/en.ts` | Corresponding English labels. |
| `lib/i18n/dictionaries/es.ts` | Corresponding Spanish labels. |
| `docs/TODO_terra_nova.md` | Mark only F21 implemented. |
| `docs/F21_accessibility.md` | Record analysis, scope, validation and remaining manual checks. |

No Prisma, database schema/data, API, authentication configuration or business
logic was changed. Successful writes were simulated for UI validation.

## Verification

Temporary Playwright/axe-core tools outside the repository drove Chrome.

- 23 routes audited: home, services and service detail, announcements, contact,
  login, register, appearance; citizen dashboard, report form, reports, report
  detail, orders, wallet, notifications and map; security, transport and commerce
  consoles; council overview, services, users and announcements.
- All returned HTTP 200; no uncaught browser errors. Axe WCAG A/AA and best-practice
  checks found no remaining non-contrast violations on these routes.
- Heading hierarchy, one main landmark per route, citizen labels, named links,
  images and shared controls were inspected.
- 17 targeted assertions passed on the final production build: four skip-link focus checks, mobile disclosure
  and Escape, theme radio selection and Escape, language selection and document
  language, password hint association, native validation focus, email description
  in Chrome's accessibility tree, contact-success focus, login-error alert,
  contextual theme-gallery action names, unique current page/native radio
  keyboard use, map focus detail, notification
  state text and mobile console logo name.
- Contact-success feedback was mocked from an invalid server-action response.
  Invalid data returns before DB access, so this check created no contact record.
- TypeScript, production build and git diff whitespace checks passed. No lint/test
  script is configured; Next.js is configured to skip linting during the build.

## Remaining checks

- A human should verify speech timing, verbosity and announcements using
  VoiceOver/Safari or NVDA/Firefox: mobile disclosure, menu selections, hints,
  validation errors, confirmation focus/reference and client-side navigation.
  Browser accessibility-tree assertions do not prove spoken output.
- The current checkout still has color-contrast failures (19 failing nodes in
  the final 23-route audit), notably red status badges and destructive controls.
  These belong to F23 and were deliberately excluded from this F21 change.
- Developer-panel screens are outside this citizen-focused audit. No complete
  WCAG conformance claim is made.

WCAG references: [Name, Role, Value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html),
[Labels or Instructions](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html),
[Info and Relationships](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html),
[Headings and Labels](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html),
[Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html),
[Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html),
[Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html).
