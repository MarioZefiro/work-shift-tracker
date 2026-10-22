# 0005. Testing strategy: Vitest and Playwright with axe

## Status
Accepted

## Context
Most risk is in logic (dates, cycles, route parsing) and in accessibility, which a unit test cannot see.
Time-dependent behaviour (midnight rollover) is easy to break and slow to check by hand.

## Decision
- Vitest (jsdom, `vite.config.ts`) with Testing Library covers logic and components; test files sit next
  to the code (`src/**/*.test.ts(x)`). `e2e/` is excluded from Vitest. Run with `npm test`.
- Playwright (`playwright.config.ts`) runs `npm run test:e2e` against a production build served by
  `vite preview` on port 4173, with locale `it-IT`.
- `e2e/a11y.spec.ts` runs axe (WCAG 2.0/2.1 A and AA tags) on the landing page and on all five pages,
  reached through the navigation. Reduced motion is forced to avoid false contrast failures mid-fade.
- `e2e/rollover.spec.ts` installs Playwright's fake clock at 23:59 Rome time and fast-forwards two hours
  to assert the home heading moves from 20 to 21 October.
- Shared fixtures: `makeSource` in `src/test-utils.ts`.
- Lighthouse accessibility is measured with Lighthouse user flows (`startFlow` + `flow.snapshot()` with Puppeteer),
  because the demo state lives in memory and a navigation run reloads the page. The measuring script is not in the repo.

## Consequences
- Axe finds only part of the accessibility problems; keyboard and screen-reader checks stay manual.
- E2E needs a build, so it is slower than unit tests; keep it to a few flows.
- The a11y list `PAGES` in `e2e/a11y.spec.ts` is maintained by hand and uses Italian labels. New pages must be added.
- CI (`.github/workflows/deploy.yml`) runs `npm test` and `npm run build` before deploying; it does not run the E2E tests or lint.
