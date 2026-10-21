# Pulse

Self-hosted, single-user home dashboard: what my AI agents did, what needs attention, links to my other apps (Burrow, Scout — my ai-job-search fork). Read-only by design — it never runs or controls agents.

## Data flow

- ChatGPT scheduled tasks can't make HTTP calls, so they append one row per run to the Google Sheet `Pulse Inbox`, tab `events`: `run_at | source | task | status | summary | payload` (payload = JSON in one cell).
- `internal/sheets` polls the tab every `PULSE_SHEET_POLL` with a read-only service account and inserts rows it has not stored yet (unique on source+task+run_at). The sheet is never modified: it stays as an append-only log. Rows with an unparseable `run_at` are skipped with a one-time warning, since there is no stable key for them.
- Known tasks: ChatGPT `mail-scan` (`{scanned, items[]}`), `invoices` (`{invoices[], totals, issues[]}`); Claude `morning-brief`, `pre-standup-brief`, `weekly-review` (`{artifact_url, headline, highlights[]}` — the HTML stays a claude.ai artifact, Pulse only links it). Agents sometimes write their display name instead of the id ("Morning brief (weekdays 9:00 Barcelona)"); `events.CanonicalTask` maps those to the id on ingest, and migration 00004 fixed rows stored before that, so one task never shows up twice. Per-task staleness thresholds live in `utils/stale.ts`. Shapes live in `web/src/features/events/types/event.ts`; attention items are derived client-side in `utils/attention.ts`; their keys (`<eventId>-<kind>-<n>`) are stable because events are immutable, so "resolved" marks are stored server-side by key (`internal/attention`, table `resolved_items`, pruned after 30 days). Resolving only hides an item; events themselves are never deleted.
- Wallpaper: single image in `$APP_DATA_DIR/wallpaper`, served at `/api/wallpaper/image?v=<mtime>` (immutable cache). When set, the root gets `data-wallpaper` and cards turn into blurred glass (`index.css`, kept outside `@layer` so it beats `bg-card`).
- First render staggers in via `.enter` + `enter(i)` from `lib/enter.ts`; pass it straight to the Card, not a wrapper — opacity on a wrapper breaks the card's backdrop blur mid-animation.
- Summary cards (`web/src/features/summary`): Scout (`internal/jobsearch`) and Burrow (`internal/gonteractive`, the repo is still called gonteractive: `/api/progress`, `/api/daily`, `/api/quizzes`) both go through `internal/remote`, which signs in with the app's password (cookie jar, re-login on 401); Pulse returns only aggregated numbers; mail is bucketed client-side from `/api/events?task=mail-scan&since=…`; invoices read `total`/`previous_total`/`by_counterparty`/`next_charge` from the latest `invoices` event (bills are direct debits, so there is no paid/unpaid state; only `status: failed` and `issues` become attention items). The "current brief" card shows the newest brief payload that ran today (`utils/currentBrief.ts`), so it follows the brief schedule without hard-coded times.
- Apps from `PULSE_APPS` (`Name=url;Name=url`) are probed server-side for the up/down badge. Logos of my own apps are bundled in `web/public/apps/` and matched by name in `features/apps/utils/appLogo.ts` (bundled, not fetched from the apps, so they show up away from home too); unknown apps get a generic icon.

## Stack

Same skeleton as gonteractive: Go stdlib `net/http`, SQLite (`modernc.org/sqlite`), `sqlc`, goose migrations on startup; React 19 + Vite + TS + Tailwind v4 + shadcn (radix-nova) + TanStack Query, SPA embedded via `web/embed.go`. Deploy: GitHub Actions (`.github/workflows/docker.yml`, on push to `master`) builds `ghcr.io/raiden0456/pulse` for amd64/arm64; the home server runs it via `deploy/casaos/docker-compose.yml` on port 8485. Tailscale runs on the host, nothing is exposed publicly.

## Commands

- `make dev-api` (API on :8080, password `dev`) + `make dev-web` (Vite on :5173, proxies `/api`).
- `make test` — `go test -race ./...`, oxlint, `tsc -b`.
- `make build`, `make generate` (after editing `internal/store/queries` or migrations).

## Conventions

- No code comments by default; doc comments only for non-obvious contracts.
- Never edit `internal/store/db/*` by hand; schema changes = new goose migration.
- UI is bilingual (ru/en): every user-facing string goes through `t()` from `@/i18n`, keys in `web/src/i18n/locales/en.ts` (source of truth, typed) and `ru.ts`. Task names are `task.<id>` keys. Language and wallpaper dimming are stored server-side (`/api/settings/interface`) so every device matches; the locale is also cached in localStorage.
- Payloads come from LLMs: treat them as untrusted shape — guard in `utils/payload.ts`, never assume fields exist.
- Styling follows gonteractive. Light theme uses Radix Colors (slate neutrals, indigo primary; `hue-*`, `success`, `warning`, `destructive` = step 11 so they read as text and as `/10`–`/20` tints; `success-solid`/`warning-solid` = step 9 for bars, dots and other solid fills, since step 11 amber turns brown as a fill). Dark theme stays One Dark, where the solid tokens equal the regular ones. Theme is picked in the Appearance menu (next-themes, per device). Card headers use `IconChip` with a `Tone` from `lib/tones.ts`; the greeting is plain text marked `text-legible`: over a wallpaper in dark mode it turns white (no shadows); otherwise it is untouched. Data marks use shades of the single primary hue; red/amber only mean critical/warning, other hues are for icons and badges.
