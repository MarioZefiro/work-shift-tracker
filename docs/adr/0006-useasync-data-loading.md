# 0006. Data loading with a shared useAsync hook

## Status
Accepted

## Context
`HomePage` and `GroupGate` both load from a `DataSource` and need loading, error-with-retry and ready states.
Hand-written effects risk stale responses overwriting newer ones and setState-in-effect warnings.

## Decision
`useAsync(load, deps)` in `src/app/useAsync.ts` returns `{ status, data, reload }`.
- Status is `loading`, `error` or `ready`, derived by comparing a request counter with the counter stored
  on the result; no synchronous setState in the effect.
- When `deps` change (compared with `Object.is`) the counter bumps during render, and only the latest
  request can set a result (a `cancelled` flag in the effect cleanup).
- `reload()` bumps the counter and re-runs the latest `load`.
- Used by `src/pages/GroupGate.tsx` (deps: `[source]`) and `src/pages/HomePage.tsx`; `LoadState` shows the
  retry button wired to `reload`. Behaviour is tested in `src/app/useAsync.test.ts`.

## Consequences
- Reload after writes: a write can call `reload()` once write methods exist on `DataSource`. Not built yet.
- Realtime updates: not implemented; they would need a way to trigger `reload` or set data from a subscription.
  Not designed yet.
- No caching, deduplication or optimistic updates; the same data is fetched again per consumer.
  Revisit if more pages share data, or adopt a query library at that point.
