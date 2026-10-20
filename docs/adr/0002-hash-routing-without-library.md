# 0002. Hash-based routing without a library

## Status
Accepted

## Context
The app has five top-level pages and no nested layouts. The static site may be hosted on GitHub Pages
(`CLAUDE.md` lists it or Vercel; the actual deploy setup is not verified), which cannot rewrite unknown
paths to `index.html`.

## Decision
`src/app/useRoute.ts` reads `window.location.hash` with `useSyncExternalStore` and the `hashchange` event.
- Route names are English (`home`, `people`, `profile`, `settings`, `faq`), independent of UI language.
- The hash is split on `/`; the first segment is the route, the remaining segments are `params`.
- Unknown or empty hashes fall back to `home`.
- The snapshot is the raw hash string (a stable primitive); the `{ name, params }` object is memoised from it.
- No router dependency. `src/App.tsx` switches on the route name.

## Consequences
- The part after `#` is never sent to the server, so deep links and reloads work on any static host with
  no rewrite rules.
- No nested routes, route guards, data loaders or typed params. `params` is parsed but no page uses it yet.
- URLs contain `#/`. Revisit if we need server-rendered pages, or if routes become nested or parameterised
  enough that a library costs less than the hand-written code.
