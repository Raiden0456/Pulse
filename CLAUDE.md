# Pulse

Self-hosted, single-user home dashboard: what my AI agents did, what needs attention, links to my other apps (gonteractive, ai-job-search). Read-only by design — it never runs or controls agents.

## Data flow

- ChatGPT scheduled tasks can't make HTTP calls, so they append one row per run to the Google Sheet `Pulse Inbox`, tab `events`: `run_at | source | task | status | summary | payload` (payload = JSON in one cell).
- `internal/sheets` polls the tab every `PULSE_SHEET_POLL` with a service account (sheet shared with it as Editor), upserts rows into `events` (unique on source+task+run_at), then deletes the synced rows from the sheet.
- Known tasks: ChatGPT `mail-scan` (`{scanned, items[]}`), `invoices` (`{invoices[], totals, issues[]}`); Claude `morning-brief`, `pre-standup-brief`, `weekly-review` (`{artifact_url, headline, highlights[]}` — the HTML stays a claude.ai artifact, Pulse only links it). Per-task staleness thresholds live in `utils/stale.ts`. Shapes live in `web/src/features/events/types/event.ts`; attention items are derived client-side in `utils/attention.ts`.
- Wallpaper: single image in `$APP_DATA_DIR/wallpaper`, served at `/api/wallpaper/image?v=<mtime>` (immutable cache). When set, the root gets `data-wallpaper` and cards turn into blurred glass (`index.css`, kept outside `@layer` so it beats `bg-card`).
- First render staggers in via `.enter` + `enter(i)` from `lib/enter.ts`; pass it straight to the Card, not a wrapper — opacity on a wrapper breaks the card's backdrop blur mid-animation.
- Apps from `PULSE_APPS` (`Name=url;Name=url`) are probed server-side for the up/down badge.

## Stack

Same skeleton as gonteractive: Go stdlib `net/http`, SQLite (`modernc.org/sqlite`), `sqlc`, goose migrations on startup; React 19 + Vite + TS + Tailwind v4 + shadcn (radix-nova) + TanStack Query, SPA embedded via `web/embed.go`. Deploy = `compose.yaml` with a Tailscale sidecar, tailnet-only (no Funnel).

## Commands

- `make dev-api` (API on :8080, password `dev`) + `make dev-web` (Vite on :5173, proxies `/api`).
- `make test` — `go test -race ./...`, oxlint, `tsc -b`.
- `make build`, `make generate` (after editing `internal/store/queries` or migrations), `make docker` (needs `.env` and `secrets/google.json`).

## Conventions

- No code comments by default; doc comments only for non-obvious contracts.
- Never edit `internal/store/db/*` by hand; schema changes = new goose migration.
- UI strings are Russian, inline (no i18n).
- Payloads come from LLMs: treat them as untrusted shape — guard in `utils/payload.ts`, never assume fields exist.
