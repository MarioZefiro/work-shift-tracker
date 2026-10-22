# 0008. Content Security Policy as a meta tag injected at build

## Status
Accepted

## Context
The session token of `supabase-js` lives in `localStorage`, so a script injected into the page could steal it.
The app has no known injection point, but a policy limits the damage of a future one. GitHub Pages cannot send
response headers. The Supabase URL differs per project and comes from `VITE_SUPABASE_URL` at build time.

## Decision
A small inline plugin in `vite.config.ts` adds a `<meta http-equiv="Content-Security-Policy">` tag to `index.html`
when the command is `build`.
- `connect-src` is `'self'` plus the origin of `VITE_SUPABASE_URL`, read with `loadEnv`, so the policy matches the
  project that is deployed and is not a wildcard.
- `default-src 'self'`, `img-src 'self' data:`, `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`.
- `style-src` keeps `'unsafe-inline'` because React writes `style` attributes.
- `<meta name="referrer" content="no-referrer">` is static in `index.html`.
- The dev server gets no policy: hot reload needs an inline script and a websocket.

## Consequences
- `frame-ancestors` is ignored in a meta tag, so the page can still be framed. Fixing that needs a host that sends
  headers (Vercel, Netlify), and the same policy can move to a header there.
- Any new external origin must be added in `vite.config.ts`, or the browser blocks it.
- The policy is checked only in the built site: `npm run test:e2e` builds and serves it, so the accessibility
  tests run with the policy active.
- Alternatives set aside: a static meta tag with `https://*.supabase.co` (lets the page talk to any Supabase
  project), and no policy (nothing limits a future injection).
