# 0002. Hash-based routing without a library

## Status
Accepted

## Context
The app has seven flat routes and no nested layouts. The static site is deployed to GitHub Pages
(`.github/workflows/deploy.yml`), which cannot rewrite unknown paths to `index.html`.

## Decision
`src/app/useRoute.ts` reads `window.location.hash` with `useSyncExternalStore` and the `hashchange` event.
- Route names are English (`home`, `people`, `profile`, `settings`, `faq`, plus `invite` and `manage`), independent of UI language.
- The hash is split on `/`; the first segment is the route, the remaining segments are `params`.
- Unknown or empty hashes fall back to `home`.
- The snapshot is the raw hash string (a stable primitive); the `{ name, params }` object is memoised from it.
- No router dependency. `src/GroupPages.tsx` renders the page for the route name; an `invite` route, or `manage` in the demo, falls back to home.

## Consequences
- The part after `#` is never sent to the server, so deep links and reloads work on any static host with
  no rewrite rules.
- No nested routes, route guards, data loaders or typed params. `params` is a list of strings; only `#/invite/<code>` reads it (the invitation code).
- URLs contain `#/`. Revisit if we need server-rendered pages, or if routes become nested or parameterised
  enough that a library costs less than the hand-written code.
