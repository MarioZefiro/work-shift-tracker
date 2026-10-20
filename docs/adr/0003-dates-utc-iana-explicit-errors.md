# 0003. Dates: UTC ISO instants, IANA zone of the group, explicit errors

## Status
Accepted

## Context
Shifts cross midnight and DST changes (Europe/Rome moves on 2026-03-29 and 2026-10-25). Naive
"add 24h" or "parse local string" code silently produces wrong times on those days.

## Decision
- Shifts store `startsAt`/`endsAt` as UTC ISO instants. Each group has an IANA `timeZone`
  (`Group` in `src/lib/types.ts`; demo uses `Europe/Rome`).
- `zonedToUtc` in `src/lib/time.ts` converts a local date and time to an instant using `Intl` only.
  It throws `RangeError` for impossible dates, `NonexistentLocalTimeError` for the spring gap and
  `AmbiguousLocalTimeError` for the autumn repeat (tested in `src/lib/time.test.ts`).
- Day arithmetic is done on date strings (`addDays`), not milliseconds.
- `generateCycle` (`src/lib/cycle.ts`) gives shifts a real duration. The autumn night shift starting
  22:00 on 2026-10-24 lasts exactly 8 real hours, so it is shown as 22:00-05:00 (seven hours apart on the clock face, eight real hours, because one hour repeats);
  rest days span the whole local day (25 real hours on 2026-10-25). See `src/lib/cycle.test.ts`.
- "Today" is `localDateIn(now, group zone)`, never the browser's zone. `useNow` (`src/app/useNow.ts`)
  checks every 60 s and on `visibilitychange`, and changes identity only when the group's calendar day changes.

## Consequences
- Callers must handle the two error classes when accepting user-entered times.
- Rosters defined as "22:00 local" are honoured; the cost is that displayed end times can look odd on DST days.
- A shift generated for a gap time fails loudly instead of shifting by an hour. Revisit if users need a
  rule for resolving those cases automatically. `Temporal` could replace the helpers once widely available (not verified).
