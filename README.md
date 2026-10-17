<p align="center">
  <img src="web/public/logo.svg" width="96" alt="Pulse logo">
</p>

<h1 align="center">Pulse</h1>

<p align="center">
  A self-hosted home dashboard for your AI agents and apps.<br>
  What your scheduled ChatGPT and Claude tasks did, what needs your attention, and one-click links to your other services, on one screen.
</p>

---

## Features

- **Today screen**: a greeting for the time of day, plus counters for open items, healthy agents and apps that are online.
- **Needs attention**: critical and warning emails from the mail scan, overdue or unpaid invoices, invoice issues and failed agent runs from the last three days, most severe first, with a direct link to the email.
- **Agents**: the last run of every scheduled task. A task turns yellow when it has been quiet for longer than its schedule allows and red when its last run failed.
- **Activity**: a timeline of every report. Claude briefs show their headline, key points and a link to the full HTML artifact.
- **Apps**: links to your other self-hosted apps, each health-checked from the server with its latency.
- **Wallpaper**: upload a background photo and the cards turn into frosted glass. The image is stored on the server, so every device sees the same one.
- **Read-only by design**: Pulse never runs, stops or edits your agents. If it is down, your agents keep working and their reports wait in the sheet.
- Light and dark themes that follow the system, a staggered first render, and a layout that works on phones.

## How agents report

Scheduled tasks in ChatGPT and Claude run in the vendors' clouds. ChatGPT tasks cannot make HTTP requests, and a home server on a tailnet is not reachable from those clouds. So agents do not call Pulse. Each run instead appends **one row** to a Google Sheet through the Google connector both apps already have, and Pulse pulls from that sheet.

```
ChatGPT / Claude task ──append row──▶ Google Sheet "Pulse Inbox" ◀──poll + delete── Pulse ──▶ SQLite
```

Every `PULSE_SHEET_POLL`, Pulse reads all data rows, stores them (deduplicated on source, task and run time), and then deletes those rows from the sheet. The sheet stays almost empty, so it uses no meaningful Drive storage. Rows appended during a sync sit below the deleted range and are picked up on the next poll.

The tab (default `events`) has a header row and these columns:

| Column | Value |
| --- | --- |
| A `run_at` | Run time, ISO 8601 with time zone |
| B `source` | `chatgpt`, `claude`, … |
| C `task` | Task id, for example `mail-scan` |
| D `status` | `ok` or `error` |
| E `summary` | One or two sentences |
| F `payload` | Task-specific JSON on one line |

The payload shapes Pulse understands:

| Task | Payload |
| --- | --- |
| `mail-scan` | `{"scanned": 5, "items": [{"severity": "critical\|warning", "from", "subject", "received_at", "reason", "action", "deadline", "link"}]}` |
| `invoices` | `{"invoices": [{"counterparty", "number", "amount", "currency", "issued_at", "due_at", "state": "new\|paid\|unpaid\|overdue", "note"}], "totals": {}, "issues": []}` |
| `morning-brief`, `pre-standup-brief`, `weekly-review` | `{"artifact_url", "headline", "highlights": []}` |

Unknown tasks still appear in Activity and Agents with their summary. Payloads come from LLMs, so Pulse strips markdown code fences and treats invalid JSON as empty instead of failing.

To connect a task, append an instruction like this to the end of its prompt:

```text
At the end of the run, without asking for confirmation, append ONE new row to the end of the "events" tab of the "Pulse Inbox" spreadsheet. Do not touch existing rows.
A run_at: current time, ISO 8601 with time zone
B source: chatgpt
C task: mail-scan
D status: ok or error
E summary: 1-2 sentences
F payload: ONLY valid single-line JSON, no markdown: {...}
If there is nothing to report, still append the row with an empty list.
```

## Stack

- **Backend**: Go, SQLite (`modernc.org/sqlite`, no CGO), `sqlc`, `goose` migrations, Google Sheets API.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query. It is embedded into the Go binary.
- **Deployment**: one Docker image built by GitHub Actions and run by CasaOS on a home server, reached over Tailscale.

The result is a single binary and a single `.db` file.

## Google setup

Pulse reads the sheet with a service account.

1. In the [Google Cloud console](https://console.cloud.google.com), create a project and enable the **Google Sheets API**.
2. Create credentials for **Application data**, which creates a service account. Skip the role step.
3. Open the service account, go to **Keys → Add key → Create new key → JSON**, and save the file.
4. Share the `Pulse Inbox` spreadsheet with the service account's e-mail as **Editor**. Editor access is needed to delete synced rows.
5. Copy the spreadsheet ID from its URL: `docs.google.com/spreadsheets/d/<ID>/edit`.

The key grants access to the sheet. Keep it out of git; `secrets/` is ignored.

## CasaOS

CasaOS cannot build images, so it runs the prebuilt one. Tailscale runs on the host.

1. Publish the image. Pushing to `master` runs [`.github/workflows/docker.yml`](.github/workflows/docker.yml), which builds `ghcr.io/<owner>/pulse` for amd64 and arm64. On the first run, open **Packages → pulse → Package settings** on GitHub and make it **Public**, or run `docker login ghcr.io` on the server with a token that has `read:packages`.
2. Put the key on the server. The container runs as uid 1000, so it has to own the file:
   ```bash
   sudo mkdir -p /DATA/AppData/pulse/data
   sudo cp google.json /DATA/AppData/pulse/google.json
   sudo chown 1000:1000 /DATA/AppData/pulse/google.json
   sudo chmod 600 /DATA/AppData/pulse/google.json
   ```
3. In CasaOS, open **App Store → Custom Install → Import**, paste [`deploy/casaos/docker-compose.yml`](deploy/casaos/docker-compose.yml), and set at least `APP_PASSWORD`, `PULSE_SHEET_ID` and `PULSE_APPS`. Pulse refuses to start without a password. It listens on port `8485`.
4. Open `http://<server>:8485` from any device in your tailnet. Traffic inside a tailnet is already encrypted. For an `https://` URL, run this on the server:
   ```bash
   sudo tailscale serve --bg --https=8485 http://127.0.0.1:8485
   ```

Run only **one** Pulse with `PULSE_SHEET_ID` set. Every instance deletes the rows it syncs, so a second one, such as a local dev server, would steal reports from the first.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `APP_PASSWORD` | (required) | The password for the single user. |
| `TZ` | `UTC` | Time zone for the greeting and dates. |
| `PULSE_SHEET_ID` | (empty) | ID of the inbox spreadsheet. Sync is disabled when empty. |
| `GOOGLE_APPLICATION_CREDENTIALS` | (empty) | Path to the service account JSON key. Sync is disabled when empty. |
| `PULSE_SHEET_TAB` | `events` | Tab that agents append rows to. |
| `PULSE_SHEET_POLL` | `5m` | How often to pull rows. The minimum is `1m`. |
| `PULSE_APPS` | (empty) | Apps to link and health-check: `Name=http://host:port;Other=http://host:port`. Use addresses the container can reach, such as the server's LAN IP; `*.ts.net` names may not resolve inside Docker. |
| `APP_ADDR` | `:8080` | HTTP listen address. |
| `APP_DATA_DIR` | `data` (`/data` in Docker) | Location of the SQLite database and the wallpaper. |
| `APP_COOKIE_SECURE` | `auto` | `auto` marks the session cookie `Secure` only for HTTPS requests; `true`/`false` force it. |

To back up, stop the container and copy `/DATA/AppData/pulse/data`.

## Local development

Requirements: Go (see `go.mod`) and Node.js 24 with pnpm.

```bash
cd web && pnpm install && cd ..
cp .env.example .env

make dev-api   # API on :8080; reads .env, password defaults to "dev"
make dev-web   # Vite on :5173, proxies /api to :8080
```

Open http://localhost:5173. Leave `PULSE_SHEET_ID` empty locally while the server is running (see above).

| Command | What it does |
| --- | --- |
| `make test` | Go tests with the race detector, lint and typecheck for the frontend. |
| `make build` | Build the frontend and `bin/pulse`. |
| `make generate` | Regenerate the `sqlc` query code after editing `internal/store/queries` or migrations. |

## Project layout

```
cmd/pulse/            entry point
internal/
  sheets/             Google Sheets ingester (pull, store, delete)
  events/             event storage and API
  apps/               app links and health checks
  wallpaper/          background image upload and serving
  auth/ config/ httpx/ server/
  store/              SQLite, migrations, sqlc queries
web/                  React app (embedded into the binary)
  src/features/       today, events, apps, wallpaper, auth
deploy/casaos/        CasaOS compose
```
