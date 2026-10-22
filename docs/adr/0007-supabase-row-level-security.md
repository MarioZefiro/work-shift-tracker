# 0007. Supabase with row level security, and membership changes through functions

## Status
Accepted

## Context
The signed-in mode needs accounts, groups and shifts shared between people, without a server of our own. Shifts are
personal data and the app is a static site, so the browser cannot be trusted to enforce any rule: whatever
the client sends, the database must refuse what the user may not do.

## Decision
- **Backend:** Supabase (Postgres and Auth). The browser holds only the publishable key. Secret and
  `service_role` keys never go in a `VITE_` variable. The schema is versioned in `supabase/migrations/`.
- **Row level security on every table.** `anon` has no grants. `authenticated` has only the grants the
  policies need, and update grants are per column (for example only `group_members.role`), so a manager cannot
  rewrite keys such as `user_id` or `group_id`.
- **The role lives in `group_members.role`, not in the token.** A role change applies at once instead of when
  the token refreshes.
- **Helper functions** `private.is_member`, `private.is_manager` and `private.shares_group` run as their owner
  with an empty `search_path`, so policies can look at `group_members` without recursing into their own rules.
- **Joining and creating go through four functions**: `create_group`, `create_invite`, `preview_invite` and
  `accept_invite`. There is no insert policy on `groups`, `group_members` or `group_invites`, so a client cannot
  add itself to a group. Invitation codes have 192 random bits, only the sha256 hash is stored, and
  `accept_invite` locks the invitation row so two people racing for a single-use invitation take turns.
  Unknown, expired, revoked and used-up invitations all give the same error, so a guesser learns nothing.
- **A group always keeps a manager**, enforced by a trigger on `group_members`.
- **Sign-in is a link sent by email.** The link must return under the app's base path.
- **Least privilege on `shifts`** (`…_hardening.sql`): only `code`, `starts_at` and `ends_at` can be updated, a
  label is 1 to 60 characters, and a trigger rejects a `time_zone` that is not an IANA name, because a bad zone would
  break the calendar of every member. A check constraint cannot read `pg_timezone_names`, hence the trigger.
- **Tests:** pgTAP files in `supabase/tests/` (57 assertions: 33 for the access rules, 24 for the functions) run on
  the local stack with `npx supabase test db`.

## Consequences
- The tests need a container runtime for the local stack.
- Part of the logic is SQL and part is TypeScript. The functions run as their owner, so a mistake there would
  bypass the rules: they are kept small and covered by tests.
- The schema forbids two shifts starting at the same instant for one member, not two shifts on the same day.
  The manager screen checks the day and gives a clear message; a stale screen could still create two shifts.
- `supabase-js` roughly doubles the JavaScript bundle (247 KB to 481 KB in the production build).
- Alternatives set aside: the role in a token claim (stale until the token refreshes), client-side checks
  only, and a server of our own (out of scope for this project).
