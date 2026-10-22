<p align="center">
  <img src="web/public/logo.svg" width="96" alt="Pulse logo">
</p>

<h1 align="center">Pulse</h1>

<p align="center">
  My personal morning screen.<br>
  Everything my AI agents did while I was busy, what actually needs me, and a door into the rest of my home server.
</p>

---

## Why I built this

I run a bunch of AI automations, and they were scattered across too many places.

| Where | Task | When |
| --- | --- | --- |
| Claude (work) | Morning brief | weekdays 9:00 |
| Claude (work) | Pre-standup brief | weekdays 14:40 |
| Claude (work) | Weekly review | Fridays 16:00 |
| ChatGPT (personal) | Scan my mail for critical and problematic emails | scheduled |
| ChatGPT (personal) | Keep my invoices in order in Google Drive | scheduled |

On top of that I self-host two apps on my home server: [Burrow](https://github.com/Raiden0456/gonteractive), my Go tutor, and Scout, my fork of [ai-job-search](https://github.com/MadsLorentzen/ai-job-search) that runs my job hunt.

Every morning I had to open the Claude app, the ChatGPT inbox, Gmail and two browser tabs to find out what had happened. I wanted one page that says "good morning, Vrezh", shows what happened and what needs me right now, and lets me jump into the right app. That page is Pulse.

It is built for exactly my setup: the greeting has my name in it, and it knows the payloads of my own tasks. I am not trying to make it a product. If you want something similar, fork it and bend it to your own agents.

## What it shows

- **Today**: the greeting and four summary cards, each with one headline and one tiny chart:
  - **Scout**: a funnel bar from drafts to offers and the shortlist size, headlined by whatever needs action first: applications quiet for 10+ days, then unsent drafts. Pulled live from Scout.
  - **Burrow**: whether today's daily Go quiz is done (with the score), in progress or still scheduled, my streak, and practice over the last week. Pulled live from Burrow.
  - **Mail**: critical and warning emails per day over the last week.
  - **Invoices**: what got billed this month, split by provider, compared with last month, plus the next direct debit. Everything is charged automatically, so the card only shouts when a charge fails or a bill looks off.
- **Needs attention**: critical and warning emails from the mail scan, overdue or unpaid invoices and invoice issues, plus any agent run that failed, all from the last three days. The most severe items come first, each with a link straight to the email. Anything I've already dealt with I mark as resolved (one by one or all at once): it moves to a collapsed "Resolved" list where I can bring it back, and like everything else it drops off after three days.
- **Agents**: the last run of every task. A task turns yellow when it has been quiet longer than its schedule allows (four days for the weekday briefs, so weekends do not count, and eight for the weekly review) and red when its last run failed.
- **Today's brief**: right under the greeting, the latest brief that ran today (morning brief in the morning, the pre-standup one before standup, the weekly review on Friday) with its key points and an "Open brief" button. Every brief in the Agents list is clickable too.
- **Activity**: a timeline of every report, the latest 10 first with "Show more" for older ones. Claude briefs show their headline and key points, with a link to the full HTML artifact.
- **Apps**: Burrow and Scout, health-checked from the server with their latency.
- **Wallpaper**: I can put a photo behind everything, and the cards turn into frosted glass. A slider sets how much the photo is dimmed.
- **Russian or English**: a toggle in the header. The language and the dimming are stored on the server, so my laptop and phone always match.

## Decisions

**Read-only, not an orchestrator.** My first idea was a control center that runs Claude and Codex as workers. I dropped it. The scheduled tasks already run reliably in the vendors' clouds, including when my server is down, and I did not want to rebuild that. Pulse only observes. If it is down, nothing breaks, and the reports wait.

**A Google Sheet as the inbox.** Agents cannot simply call Pulse:

- ChatGPT scheduled tasks have no way to make an HTTP request. They can only use connectors.
- My server lives on a Tailscale network, so it is not reachable from Anthropic's or OpenAI's clouds, and I do not want to expose it to the internet.

Both apps can write to Google Sheets through their connectors, though. So each run appends one row to a sheet called `Pulse Inbox`, and Pulse pulls from it.

```
ChatGPT / Claude task ──append row──▶ Google Sheet "Pulse Inbox" ◀──poll (read-only)── Pulse ──▶ SQLite
```

Pulse only reads the sheet and never changes it, so the sheet doubles as a plain log of every run that I can open and scroll. On each poll Pulse reads the whole tab and stores the rows it has not seen yet, keyed on source, task and run time. A row whose `run_at` cannot be parsed has no stable key, so Pulse skips it and logs a warning once.

**Links to artifacts, not the HTML itself.** Claude briefs are styled HTML artifacts, and a sheet cell holds at most 50,000 characters. So the row carries the artifact link and a short digest, and the full brief opens in claude.ai.

## How my agents report

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
| `invoices` | `{"month": "2026-10", "currency": "EUR", "total", "previous_total", "by_counterparty": [{"name", "amount"}], "next_charge": {"counterparty", "amount", "currency", "charge_at"}, "invoices": [{"counterparty", "amount", "currency", "issued_at", "charge_at", "status": "charged\|scheduled\|failed", "note"}], "issues": []}`. My bills are all direct debits, so there is no "paid" state: `total` covers the whole month, `invoices` only new or changed ones, and only failed charges and `issues` reach "Needs attention" |
| `morning-brief`, `pre-standup-brief`, `weekly-review` | `{"artifact_url", "headline", "highlights": []}` |

Unknown tasks still appear in Activity and Agents with their summary. Payloads come from LLMs, so Pulse strips markdown code fences and treats invalid JSON as empty instead of failing.

Each of my tasks ends with an instruction like this:

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

The same skeleton as Burrow, so both apps build and deploy the same way.


- **Backend**: Go, SQLite (`modernc.org/sqlite`, no CGO), `sqlc`, `goose` migrations, Google Sheets API.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query. It is embedded into the Go binary.
- **Deployment**: one Docker image built by GitHub Actions and run on my home server (CasaOS / ZimaOS), reached over Tailscale.

The result is a single binary and a single `.db` file.

## Google setup

Pulse reads the sheet with a service account.

1. In the [Google Cloud console](https://console.cloud.google.com), create a project and enable the **Google Sheets API**.
2. Create credentials for **Application data**, which creates a service account. Skip the role step.
3. Open the service account, go to **Keys → Add key → Create new key → JSON**, and save the file.
4. Share the `Pulse Inbox` spreadsheet with the service account's e-mail as **Viewer**. Pulse only reads it.
5. Copy the spreadsheet ID from its URL: `docs.google.com/spreadsheets/d/<ID>/edit`.

The key grants access to the sheet. Keep it out of git; `secrets/` is ignored.

## Running it on CasaOS / ZimaOS

This is how I run it at home. Everything is done in the web UI; no SSH is needed. CasaOS and ZimaOS cannot build images, so they run the prebuilt one.

**1. Publish the image** (one time). Pushing to `master` runs [`.github/workflows/docker.yml`](.github/workflows/docker.yml), which builds `ghcr.io/<owner>/pulse` for amd64 and arm64. When the first run is green, open **Packages → pulse → Package settings** on GitHub and set the visibility to **Public**, so the server can pull it without logging in.

**2. Upload the Google key.** Open the **Files** app and create the folder `/DATA/AppData/pulse/secrets` (on ZimaOS, `AppData` is listed under the system storage). Upload the service account key into it and rename it to exactly `google.json`. Do this before installing, or create the folder at least: Pulse only reads the key from that folder, and the container makes its own readable copy, so the file's owner and permissions do not matter.

**3. Install the app.**

- **CasaOS**: **App Store → Custom Install** (top right) → **Import** icon.
- **ZimaOS**: **App Store → +** (top right) → **Install a customized app** → **Import**.

Paste the contents of [`deploy/casaos/docker-compose.yml`](deploy/casaos/docker-compose.yml) and confirm. Then fill in the environment variables in the form:

| Variable | What to put there |
| --- | --- |
| `APP_PASSWORD` | Your sign-in password. Pulse refuses to start without it. |
| `TZ` | Your time zone, for example `Europe/Madrid`. |
| `PULSE_SHEET_ID` | The spreadsheet ID from [Google setup](#google-setup). |
| `PULSE_APPS` | The other apps by LAN address, for example `Burrow=http://192.168.1.10:8484;Scout=http://192.168.1.10:8095`. |
| `JOBSEARCH_URL`, `JOBSEARCH_PASSWORD` | Scout's address and password, for the Scout card. |
| `GONTERACTIVE_URL`, `GONTERACTIVE_PASSWORD` | Burrow's address and password, for the streak and daily quiz card. |

Leave `GOOGLE_APPLICATION_CREDENTIALS`, `PULSE_SHEET_TAB` and `PULSE_SHEET_POLL` as they are, then press **Install**. The app's data lives in `/DATA/AppData/pulse/data`.

**4. Open Pulse** with the app tile or at `http://<server-ip>:8485`, and sign in. Within a few seconds the rows from the sheet appear on the dashboard. The sheet itself stays untouched.

If they do not, open the app's **logs** in the dashboard (the app tile menu → **Logs** / **Settings**). `sheet synced rows=N added=N` means new rows were picked up (it is only logged when something new arrives). `sheet ingest disabled` means `PULSE_SHEET_ID` is empty. A permission error means the sheet is not shared with the service account. If the container keeps restarting, `google.json` is missing or misnamed while `PULSE_SHEET_ID` is set.

**5. Optional HTTPS.** Traffic inside a tailnet is already encrypted, so `http://` works fine. For an `https://<server>.<tailnet>.ts.net` address, run this in a terminal on the server:

```bash
sudo tailscale serve --bg --https=8485 http://127.0.0.1:8485
```

If Tailscale runs as an app container instead of on the host, prefix it with `docker exec <tailscale-container>`.

**Updating**: after a new image is published, use **Check then update** / **Update** on the app tile.

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
| `JOBSEARCH_URL` | (empty) | Base URL of Scout (ai-job-search) for the summary card, for example `http://192.168.1.10:8095`. The card asks to be connected when empty. |
| `JOBSEARCH_PASSWORD` | (empty) | Scout's `APP_PASSWORD`. Pulse signs in like a browser and reuses the session cookie, so the fork needs no changes. |
| `GONTERACTIVE_URL` | (empty) | Base URL of Burrow (repo `gonteractive`) for the streak and daily quiz card, for example `http://192.168.1.10:8484`. |
| `GONTERACTIVE_PASSWORD` | (empty) | Burrow's `APP_PASSWORD`, used the same way as for Scout. |
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

Open http://localhost:5173. Setting `PULSE_SHEET_ID` locally is safe: Pulse only reads the sheet, so a dev instance does not interfere with the one at home.

| Command | What it does |
| --- | --- |
| `make test` | Go tests with the race detector, lint and typecheck for the frontend. |
| `make build` | Build the frontend and `bin/pulse`. |
| `make generate` | Regenerate the `sqlc` query code after editing `internal/store/queries` or migrations. |

## Project layout

```
cmd/pulse/            entry point
internal/
  sheets/             Google Sheets ingester (read-only)
  events/             event storage and API
  apps/               app links and health checks
  wallpaper/          background image upload and serving
  remote/             cookie-session client for my other apps
  jobsearch/          Scout (ai-job-search) summary
  gonteractive/       Burrow streak and daily quiz summary
  settings/           language and wallpaper dimming
  auth/ config/ httpx/ server/
  store/              SQLite, migrations, sqlc queries
web/                  React app (embedded into the binary)
  src/features/       today, summary, events, apps, wallpaper, settings, auth
deploy/casaos/        CasaOS / ZimaOS compose
```

## Credits

The Go gopher in the Burrow app logo was designed by [Renée French](https://reneefrench.blogspot.com/) and is used under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). See [NOTICE](NOTICE).
