# Pulse

Self-hosted, single-user home dashboard: what my AI agents did, what needs attention, links to my other apps (gonteractive, ai-job-search). Read-only by design — it never runs or controls agents.

## Data flow

- ChatGPT scheduled tasks can't make HTTP calls, so they append one row per run to the Google Sheet `Pulse Inbox`, tab `events`: `run_at | source | task | status | summary | payload` (payload = JSON in one cell).
- `internal/sheets` polls the tab every `PULSE_SHEET_POLL` with a service account (sheet shared with it as Editor), upserts rows into `events` (unique on source+task+run_at), then deletes the synced rows from the sheet.
- Known tasks: ChatGPT `mail-scan` (`{scanned, items[]}`), `invoices` (`{invoices[], totals, issues[]}`); Claude `morning-brief`, `pre-standup-brief`, `weekly-review` (`{artifact_url, headline, highlights[]}` — the HTML stays a claude.ai artifact, Pulse only links it). Per-task staleness thresholds live in `utils/stale.ts`. Shapes live in `web/src/features/events/types/event.ts`; attention items are derived client-side in `utils/attention.ts`.
- Wallpaper: single image in `$APP_DATA_DIR/wallpaper`, served at `/api/wallpaper/image?v=<mtime>` (immutable cache). When set, the root gets `data-wallpaper` and cards turn into blurred glass (`index.css`, kept outside `@layer` so it beats `bg-card`).
- First render staggers in via `.enter` + `enter(i)` from `lib/enter.ts`; pass it straight to the Card, not a wrapper — opacity on a wrapper breaks the card's backdrop blur mid-animation.
- Summary cards (`web/src/features/summary`): job search comes from `internal/jobsearch`, which signs into ai-job-search with `JOBSEARCH_PASSWORD` (cookie jar, re-login on 401) and returns only aggregated counts; mail is bucketed client-side from `/api/events?task=mail-scan&since=…`; invoices read `totals` (month-to-date) from the latest `invoices` event.
- Apps from `PULSE_APPS` (`Name=url;Name=url`) are probed server-side for the up/down badge.

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
- Styling follows gonteractive: One Light / One Dark tokens in `index.css`, theme picked in the Appearance menu (next-themes, per device). Card headers use `IconChip` with a `Tone` from `lib/tones.ts`; the greeting is plain text with `text-legible` (a background-coloured halo that keeps it readable over the wallpaper). Data marks use shades of the single primary hue; red/amber only mean critical/warning, other hues are for icons and badges.
