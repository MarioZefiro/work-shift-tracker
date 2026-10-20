# Turni

A shared shift tracker: see your own shift today, who works with you, your next shifts and how many people work each day of the month. This is Plan 1, a demo that runs on in-memory sample data with no backend.

Live demo: coming soon (deploy not decided yet)

<p>
  <img src="docs/screenshots/landing.png" alt="Landing page with the Try the demo button" width="260">
  <img src="docs/screenshots/home.png" alt="Home page: today's shift, upcoming shifts and the month grid" width="260">
</p>

## Features

Everything below is in `src/` today.

- Landing page with a "Try the demo" button. The demo has five sample members and an 8-week rotation of morning, afternoon, night and rest shifts.
- Home: today's shift for the demo user, the colleagues on the same shift, upcoming shifts, and a month grid showing how many people work each day.
- People: list of group members with their role.
- Profile: name, role and group of the demo user.
- Settings: language picker, the group's time zone, and a button to leave the demo.
- FAQ page.
- Five interface languages: Italian, English, French, Spanish, German. The choice is stored in `localStorage`; otherwise the browser language is used.
- "Today" follows the group's time zone (`Europe/Rome`), not the browser's, and the home date updates at midnight.
- Accessibility basics: skip link, focus moves to the main area on navigation, labelled lists and table cells, `aria-current` on the active page and day.

Not built: sign-in, a backend, adding or editing shifts, inviting colleagues.

## Note on the night shift in October

The night shift (N) starts at 22:00 and lasts 8 hours. On the night of 24 to 25 October 2026 the clocks in `Europe/Rome` go back one hour, so the app shows 22:00-05:00. That is 8 real hours, even though the clock face shows 7. This is intentional: the roster says "22:00 local, 8 hours", and the app honours it.

## Stack

From `package.json`:

- React `^19.3.1`, React DOM `^19.3.1`
- TypeScript `~7.0.2`
- Vite `^8.3.4` with `@vitejs/plugin-react` `^6.1.2`
- Vitest `^5.0.5`, Testing Library (`@testing-library/react` `^16.3.3`, `@testing-library/jest-dom` `^7.0.1`), jsdom `^30.1.3`
- Playwright `^1.64.1` with `@axe-core/playwright` `^4.14.0`
- Oxlint `^1.88.0`

No router, i18n or UI library. The reasoning is in `docs/adr/`.

## Three technical decisions

### 1. Pages talk to a `DataSource` interface, not to data

The backend is not chosen yet. Pages depend on the `DataSource` interface (`src/data/DataSource.ts`): `userId`, `group()` and `shifts({ from, to })`. The demo implements it in memory and returns promises, so loading and error states behave like a network source. A real backend will be a second implementation.
Rejected: building pages against a hard-coded fixture. Every page would need rewriting when real data arrives. Cost of my choice: the interface has one implementation, so its shape is a guess and will change. See `docs/adr/0001-datasource-interface-demo-first.md`.

### 2. Dates are UTC instants plus the group's IANA zone, with explicit errors

Shifts cross midnight and DST changes. Shifts are stored as UTC ISO instants, and local times are converted with `Intl` only. An impossible local time throws (`NonexistentLocalTimeError`, `AmbiguousLocalTimeError`) instead of silently shifting by an hour. Day arithmetic works on date strings, not milliseconds.
Rejected: adding 24 hours to a timestamp and parsing local date strings, which give wrong times on the two DST days. Cost: callers must handle the errors, and end times can look odd on those days (see the October note above). See `docs/adr/0003-dates-utc-iana-explicit-errors.md` and `src/lib/cycle.test.ts`.

### 3. Hash routing without a router library

There are five flat pages. `src/app/useRoute.ts` reads `window.location.hash` with `useSyncExternalStore`. The part after `#` never reaches the server, so reloads and deep links work on any static host with no rewrite rules.
Rejected: a router library, which is more dependency than five flat routes need. Cost: no nested routes, guards or typed params, and URLs contain `#/`. Revisit if routes become nested. See `docs/adr/0002-hash-routing-without-library.md`.

Three more ADRs cover in-house i18n, the testing strategy and the `useAsync` hook.

## Run locally

```bash
npm install
npm run dev
```

Other scripts from `package.json`:

```bash
npm run build     # tsc -b && vite build
npm run preview   # serve the production build
npm run lint      # oxlint
```

## Tests

```bash
npm test          # vitest run: logic and component tests, next to the code in src/
npm run test:e2e  # playwright test: builds the app, serves it on port 4173
```

The end-to-end tests run an axe accessibility check on the landing page and all five pages, and a midnight rollover check using a fake clock. They need the Playwright browsers installed (`npx playwright install`).
