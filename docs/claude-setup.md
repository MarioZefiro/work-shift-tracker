# Claude Code setup for this project

Updated 2026-10-20.

## Files

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Project rules, commands, definition of done, skill/agent routing table |
| `.claude/settings.json` | Shared permissions (tracked) |
| `.claude/settings.local.json` | Personal overrides (git-ignored) |
| `.claude/agents/` | 11 project agents (git-ignored) |
| `.claude/agent-memory-local/` | Per-agent memory (git-ignored) |
| `.serena/` | Serena project config and memories (cache git-ignored) |
| `docs/adr/` | Architecture decision records, 0001–0007 |

## Permissions (`.claude/settings.json`)

- **allow:** npm install/run/test, vite, vitest, tsc, oxlint, playwright, read-only git plus `add`/`commit`, edits in `src/`, `public/`, `supabase/`, WebFetch on a few doc domains.
- **ask:** `git push`, `gh repo create`, `gh pr create`, Supabase link/db push/functions deploy, Vercel.
- **deny:** read and edit of `.env` and `.env.*`.

User-level hooks (disk guard, safety net against `rm -rf` / force push / `.env` reads) apply here too; nothing is duplicated.

## Agents

| Agent | Job |
|---|---|
| `ui-dev` | React screens, accessibility, mobile layout |
| `logic-dev` | Calculations, storage, tested logic |
| `backend-dev` | Supabase schema, RLS, migrations |
| `bug-fixer` | Reproduce, find root cause, fix |
| `structure-fixer` | Folder layout and imports |
| `frontend-reviewer` | Code review |
| `readme-writer` | README |
| `adr-writer` | ADRs in `docs/adr/` |
| `design-analyst` | Design analysis |
| `lighthouse-checker` | Accessibility score (target ≥ 90) |
| `graph-keeper` | Knowledge graph in `graphify-out/` |

All are short (18–28 lines); nothing needs splitting.

## Checks

- `agnix .` on 2026-10-20: 0 errors, 0 warnings.
- Done = `npm run build`, `npm run lint`, `npm test` pass; see `CLAUDE.md`.

## Open points

1. `.claude/agents/` is git-ignored, so agents are not shared with a clone. Track it if it should be.
2. `build`, `lint`, `test` and Lighthouse were not run during this setup.
3. `.claude/settings.local.json` disables an MCP server that is not part of this project.
