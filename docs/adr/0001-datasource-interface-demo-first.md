# 0001. DataSource interface with a demo implementation before the backend

## Status
Accepted

## Context
The UI needs groups and shifts, but the backend is not chosen or built yet. Building pages against a
hard-coded fixture would mean rewriting every page once real data arrives.

## Decision
Pages depend only on the `DataSource` interface (`src/data/DataSource.ts`): `userId`, `group()` and
`shifts({ from, to })`, with `from`/`to` as inclusive local ISO dates in the group's zone.
- A source is bound to one group, so no method takes a group id.
- Writes were planned as new methods on the same interface; see the update below for where they ended up.
- The first implementation is `createDemoSource(now)` in `src/data/demo.ts`: five members, an 8-week
  rotation built with `generateCycle`, all in memory and resolved as promises (so loading and error
  paths behave like a real network source).
- Tests build sources with `makeSource(overrides)` in `src/test-utils.ts`.
- A real backend will arrive as a second implementation (the Supabase step); no details are decided here.

## Consequences
- Pages and tests never import the demo directly (only `src/App.tsx` calls `createDemoSource`).
- The interface has one production implementation today, so its shape is a guess. Expect changes
  when the second implementation lands; revisit then (error types, pagination, write methods).
- The demo filters shifts by local day of `startsAt`, so a night shift belongs to the day it starts.
  A backend must follow the same rule.

## Update (Supabase implementation)
The Supabase implementation arrived (`src/data/supabase/supabaseSource.ts`, one group and one user) and
`DataSource` did not change: it is still read-only. Writes (assigning shifts, creating groups and
invitations) live in separate modules under `src/data/supabase/`, so the pages that read data keep the same
interface. `shifts({ from, to })` follows the same rule as the demo: a shift belongs to the local day it starts.
