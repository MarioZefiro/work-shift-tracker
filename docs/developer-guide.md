# Developer guide

For someone who has to change, run or deploy Turni. The [README](../README.md) is the short tour; this file is
the map of the code and the checklist for the hosted setup. The reasoning behind the main choices is in
[`docs/adr/`](adr/).

## 1. What the app is

A shift tracker for people who work together: today's shift, who is on with you, upcoming shifts, and a month
grid with the head count per day. It has two modes that share the same screens:

| Mode | Data | Needs |
|------|------|-------|
| **Demo** | In memory: five sample members, a 10-week rotation starting the week of the 1st of the current month | Nothing |
| **Signed in** | Supabase (Postgres + Auth): accounts, groups, invitations, shifts assigned by the group manager | `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` |

There is no server of our own. The app is a static site; the database enforces the access rules.

## 2. Setup

```bash
npm install
npm run dev        # http://localhost:5173/work-shift-tracker/
```

| Script | What it does |
|--------|--------------|
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `oxlint` |
| `npm test` | `vitest run` (jsdom) |
| `npm run test:e2e` | Playwright: builds the app, serves it on port 4173 |
| `npx supabase test db` | pgTAP tests of the access rules and functions (needs the local stack) |

Signed-in mode locally: see "Run with Supabase" in the README. Without the two variables the app starts with
the demo only (`tryGetSupabase()` returns `null`).

Vite's `base` is `/work-shift-tracker/` (`vite.config.ts`), because GitHub Pages serves the project under
`/<repo>/`. Anything that builds an absolute URL must use `import.meta.env.BASE_URL`.

## 3. Code layout

```
src/
  main.tsx              Entry: ErrorBoundary > I18nProvider > App
  App.tsx               Decides what to show: demo, loading, signed-in app, login, landing
  AccountApp.tsx        Signed-in flow: name, invitation, group list, group screens
  GroupPages.tsx        The screens of one group; used by both demo and signed-in app
  app/                  Shell, routing (useRoute), useAsync, useNow, ErrorBoundary
  auth/                 AuthProvider / AuthContext: session state and email sign-in
  data/
    DataSource.ts       The interface the pages depend on
    demo.ts             In-memory implementation
    supabase/           client, instance, supabaseSource and the write modules
  lib/                  Pure logic: time, cycle, rotation, shift, home, format, types
  pages/                One file per screen, plus LoadState and small widgets
  i18n/                 Own translation layer; messages/{it,en,fr,es,de}.ts
supabase/
  migrations/           schema, rls, rpc (apply in this order)
  tests/                pgTAP
e2e/                    Playwright: accessibility (axe) and midnight rollover
docs/adr/               Architecture decision records
public/                 Static files: favicon, apple-touch-icon, home.png (landing preview), landing.png (og:image)
```

`index.html` carries the `theme-color` (light and dark), Open Graph and `apple-touch-icon` tags. `og:image` must be an
absolute URL, so it hardcodes the GitHub Pages address; `home.png` and `landing.png` in `public/` are copies of
`docs/screenshots/`, so retake both together.

Unit and component tests sit next to the code (`*.test.ts(x)`).

## 4. How the app works

### 4.1 Which screen shows (`src/App.tsx`)

`App` receives a Supabase client or `null` and wraps everything in `AuthProvider`. `AppBody` then picks the
first case that applies:

1. A demo is running → `GroupPages` on the in-memory source.
2. Auth is still loading → `LoadState`.
3. Client present and user signed in → `AccountApp`.
4. Client present and the user pressed "Accedi", opened an invitation link, or the email link failed →
   `LoginPage`.
5. Otherwise → `LandingPage` ("Prova la demo" and, if a client exists, "Accedi").

### 4.2 `DataSource`: the seam between pages and data

```ts
interface DataSource {
  readonly userId: string
  group(): Promise<Group>
  shifts(range: { from: string; to: string }): Promise<Shift[]>   // inclusive local ISO dates
}
```

Pages only know this interface. `createDemoSource(now)` and `createSupabaseSource(client, groupId, userId)` both
implement it, so a page does not know which mode it is in. It is read-only on purpose; writes (assign a shift,
create a group or invitation) live in separate modules: `data/supabase/shiftsAdmin.ts`, `groups.ts`,
`profile.ts`. See ADR 0001.

`supabaseSource` loads the group, members and shift types in parallel, remembers the group (and forgets a failed
load so "Retry" works), and reads shifts page by page because the API returns at most 1000 rows per request.

### 4.3 Signed-in flow (`src/AccountApp.tsx`)

Profile exists? If not, ask for a display name (`NamePrompt`). Then, in order:

1. An invitation code (from the URL, or kept in storage from before the sign-in) → `InvitePage`
   (preview, accept or decline).
2. A group is selected → `GroupPages` with a Supabase source. The manager gets the extra `manage` route.
3. Otherwise → `GroupsPage` (open, create, invite, sign out).

The invitation code is stored (`pendingInvite.ts`) because the email link opens in a new tab.

### 4.4 Routing

Hash routing without a library (`src/app/useRoute.ts`, ADR 0002). Routes: `home`, `people`, `profile`,
`settings`, `faq`, `invite`, `manage`. An unknown hash is `home`. Only `#/invite/<code>` uses `params`. The
hash never reaches the server, so deep links work on any static host.

### 4.4b Home month grid

`MiniMonth` shows, per day, the head count and the signed-in user's own shift as a letter chip (M/P/N/R). The
chip uses the page surface and text colour with a border in the shift colour, so its contrast does not depend
on the heat level (`[data-level]` shades). Days with data are `<button aria-pressed>`; the others stay plain.
Selection state lives in `HomePage`: choosing a day renders a list below the grid (`rosterByDate` in
`src/lib/home.ts`: every member's shift per local date, rest included, sorted by start then name); choosing it
again hides it. Nothing is selected on load, because the "today" card already names who works your shift.

### 4.5 Dates and time zones

Shifts are stored as UTC instants. Local times are derived with `Intl` in the group's IANA zone
(`src/lib/time.ts`); an impossible or ambiguous local time throws `NonexistentLocalTimeError` or
`AmbiguousLocalTimeError`. Day arithmetic uses date strings, not milliseconds. "Today" follows the group's zone,
not the browser's. See ADR 0003 and `src/lib/*.test.ts`. If you touch date code, run the tests around DST
(late March and late October).

### 4.6 Loading, errors, translations

- `useAsync(fn, deps)` returns `{ status, data, reload }`; screens render `LoadState` for loading and error
  with a Retry button (ADR 0006).
- Messages live in `src/i18n/messages/`. `it.ts` defines the keys (`MessageKey`); the other four locales must
  provide the same keys. FR, ES and DE are not native-reviewed (see README).
- A top-level `ErrorBoundary` catches render errors.

### 4.7 Forms and feedback

- Submit buttons run their request through `usePending()` (`src/app/usePending.ts`) and are `disabled` while it
  runs, so a double tap cannot post twice.
- Success is announced in one always-mounted `<p role="status">` per screen (a live region that appears together
  with its text is not announced). Failures use `<p role="alert" className="error">`; `.notice` is the same box
  for information. Border and icon carry the meaning, not colour alone.
- Deleting a shift takes two clicks (Confirm / Cancel inline, Escape cancels); focus returns to the Delete
  button on cancel and to the list heading after a delete. Use the same pattern for any new destructive action.
- Field borders use `--field` (at least 3:1 against the page). The dark block redefines `--purple` so the Night
  marker stays visible on `--surface`.

## 5. Backend (Supabase)

Everything is in `supabase/migrations/`, applied in file order. Rationale: ADR 0007.

### 5.1 Tables

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user (`id` = `auth.users.id`), `display_name`. No email column |
| `groups` | `name`, `time_zone` (default `Europe/Rome`) |
| `group_members` | `(group_id, user_id)`, `role` in `manager` / `member` |
| `group_invites` | Stores only the sha256 hash of the code, expiry, `max_uses`, `uses`, `revoked_at` |
| `shift_types` | Per group: codes `M`, `P`, `N`, `R` with label, start time, duration |
| `shifts` | `group_id`, `user_id`, `code`, `starts_at`, `ends_at`; unique per user and start |

A shift's `(group_id, user_id)` references `group_members`, so leaving a group deletes its shifts.

### 5.2 Access model

- Row level security is on for every table. `anon` has no grants; `authenticated` has only what the policies
  need, with column-level `update` grants (a manager cannot rewrite `user_id` or `group_id`).
- Members read their group's data; managers write shifts, shift types, roles and invitations.
- There is no insert policy on `groups`, `group_members` or `group_invites`: creating and joining go through
  four functions, `create_group`, `create_invite`, `preview_invite`, `accept_invite`. They run as the owner and
  check everything themselves.
- Helper functions live in the `private` schema (`is_member`, `is_manager`, `shares_group`) with an empty
  `search_path`.
- A trigger keeps at least one manager in every group.
- Limits in the functions: at most 10 active invitations per group, 30 members per group, invitations valid
  1 to 30 days.

### 5.3 Errors the client understands (`src/data/supabase/groups.ts`)

| SQLSTATE | Meaning | Client error |
|----------|---------|--------------|
| `P0002` | Invitation unknown, expired, revoked or used up (same message on purpose) | `InvalidInviteError` (preview returns `null`) |
| `P0001` + `group is full` | Group has 30 members | `GroupFullError` |
| `42501` | Not signed in / not a manager | generic `Error` |

### 5.4 Changing the schema

1. Add a new migration file with a later timestamp. Do not edit an applied one.
2. Add or update the pgTAP test in `supabase/tests/`.
3. Run the local stack and `npx supabase test db`.
4. Apply the same file to the hosted project (section 6.3).

Keep the rule that the browser is never trusted: a new table needs RLS, grants and a policy per operation.

## 6. Configuration and deployment

### 6.1 Variables

| Variable | Where | Value |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | `.env.local` / GitHub repo variable | The project's **base** URL, e.g. `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` / GitHub repo variable | The publishable key |

Only the publishable key may go in a `VITE_` variable, because it ends up in the built site. A secret or
`service_role` key must never. `.env.local` is git-ignored.

### 6.2 GitHub Pages

`.github/workflows/deploy.yml` runs on every push to `main` (and manually): `npm ci`, `npm test`, `npm run build`
with the two variables taken from the repository's **Actions variables**, then publishes `dist/`. A failing test
stops the deploy. The variables are baked in at build time, so changing one requires a new deploy.

### 6.3 Hosted Supabase checklist

Do these once per project, in this order:

1. **Apply the migrations** in order: `…_schema.sql`, `…_rls.sql`, `…_rpc.sql` (SQL Editor, or
   `npx supabase link` then `npx supabase db push`). Hosted projects do not get the migrations on their own.
2. **Authentication → URL Configuration:** set the Site URL and add a Redirect URL, both
   `https://<user>.github.io/work-shift-tracker/`. Add `http://localhost:5173/work-shift-tracker/` to test locally.
3. **Repo variables:** set the two variables from 6.1, then run the deploy workflow.
4. **Email:** the built-in email service is for testing. Per the Supabase docs it sends about 2 messages per hour
   and only to addresses in the project team; the limit can change without notice. A public sign-in needs a custom
   SMTP provider (available on the Free plan).
5. **Free plan:** a project with no activity for a week is paused and sign-in stops until it is resumed from the
   dashboard.

## 7. Testing

| Layer | Tool | Where | Covers |
|-------|------|-------|--------|
| Logic and components | Vitest + Testing Library | next to the code | dates, rotation, storage, auth, pages with real behaviour |
| Access rules and functions | pgTAP | `supabase/tests/` | RLS, grants, the four functions |
| End to end | Playwright + axe | `e2e/` | accessibility of every page, midnight rollover with a fake clock |

Component tests clean up in the shared `src/test-setup.ts`. Test logic that matters (calculations, storage,
rules), not every component. See ADR 0005.

## 8. Conventions

- Code, comments, commits and docs in English. Comments say **why**, never **what**.
- Strict TypeScript. No new dependency for something a few lines or the platform can do.
- Accessibility is not optional: semantic elements, labels on fields, visible focus, contrast. `npm run test:e2e`
  fails on axe violations.
- Small commits with clear messages ("Adds the group form", never "fix").
- The repository is public: no real names, no work material, no secrets.
- Before merging: `npm run build`, `npm run lint` and `npm test` must pass.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Non sono riuscito a inviare il link" and a 404 on `/rest/v1/auth/v1/otp` | `VITE_SUPABASE_URL` ends in `/rest/v1/` | Use the base URL (no path) and redeploy |
| The email link opens `localhost:3000` with `otp_expired` | Site URL and Redirect URLs not set for the hosted project | Section 6.3, step 2; request a new link |
| "Can't load the data" after signing in; `PGRST205` "table not found" | Migrations not applied on the hosted project | Section 6.3, step 1 |
| No sign-in email arrives | Built-in email limit (2 per hour) | Wait an hour, or configure custom SMTP |
| Link works once, then `otp_expired` | Links are single use; some mail apps open them to preview | Request a new one and open it once |
| `Missing VITE_SUPABASE_URL: set it in .env.local` | A client was requested without the variables | Set them, or run the demo only |
| Blank page or missing assets on a static host | Wrong `base` | Keep `base` equal to the site's sub-path |
