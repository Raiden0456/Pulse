export type Plural = { one: string; few?: string; many?: string; other: string }
export type Message = string | Plural

export const en = {
  "common.errorTitle": "Something went wrong",
  "common.open": "Open",
  "common.justNow": "just now",
  "common.switchLanguage": "Switch to Russian",

  "errors.wrongPassword": "Wrong password",
  "errors.wallpaperTooLarge": "The photo is larger than 15 MB",
  "errors.wallpaperNotImage": "This is not an image",

  "auth.tagline": "Everything that happened, on one screen",
  "auth.password": "Password",
  "auth.signIn": "Sign in",
  "auth.signingIn": "Signing in…",
  "auth.logout": "Sign out",

  "today.morning": "Good morning",
  "today.afternoon": "Good afternoon",
  "today.evening": "Good evening",
  "today.night": "Good night",
  "today.subtitle": "Here is what happened while you were away.",

  "summary.week": "7 days",
  "summary.jobs.title": "Scout",
  "summary.jobs.notConfigured": "Connect it with JOBSEARCH_URL",
  "summary.jobs.unavailable": "Scout is unreachable",
  "summary.jobs.stale": { one: "{count} application quiet 10+ days", other: "{count} applications quiet 10+ days" },
  "summary.jobs.drafted": { one: "{count} draft not sent", other: "{count} drafts not sent" },
  "summary.jobs.interview": "{count} in interviews",
  "summary.jobs.waiting": "{count} awaiting a reply",
  "summary.jobs.clear": "Nothing in flight",
  "summary.jobs.shortlist": "{count} in the shortlist · {strong} strong",
  "summary.jobs.stage.drafted": "drafts",
  "summary.jobs.stage.applied": "sent",
  "summary.jobs.stage.interview": "interviews",
  "summary.jobs.stage.offer": "offers",
  "summary.jobs.stage.closed": "closed",

  "summary.go.title": "Burrow",
  "summary.go.notConfigured": "Connect it with GONTERACTIVE_URL",
  "summary.go.unavailable": "Burrow is unreachable",
  "summary.go.streak": { one: "{count} day", other: "{count} days" },
  "summary.go.done": "Daily quiz done",
  "summary.go.doneScore": "Daily quiz done · {score}%",
  "summary.go.inProgress": "Daily quiz: {answered} of {total}",
  "summary.go.scheduledAt": "Daily quiz at {time}",
  "summary.go.preparing": "Daily quiz is being prepared",
  "summary.go.idle": "No practice yet today",
  "summary.go.active": "Practised today",
  "summary.go.footer": "{due} due for review · {answers} answers today",

  "summary.mail.title": "Mail",
  "summary.mail.criticalToday": "{count} critical today",
  "summary.mail.warningsToday": { one: "{count} warning today", other: "{count} warnings today" },
  "summary.mail.calm": "All quiet today",
  "summary.mail.footer": "{scanned} emails · critical {critical} · warnings {warnings}",


  "summary.invoices.title": "Invoices",
  "summary.invoices.noTotals": "No monthly totals yet",
  "summary.invoices.lastReport": "last report {when}",
  "summary.invoices.total": "{amount} this month",
  "summary.invoices.failed": { one: "{count} charge failed", other: "{count} charges failed" },
  "summary.invoices.delta": "{delta} vs last month",
  "summary.invoices.other": "other",
  "summary.invoices.nextCharge": "next charge: {name} {amount}, {date}",

  "brief.open": "Open brief",
  "attention.title": "Needs attention",
  "attention.window": "Last 3 days",
  "attention.empty": "Nothing urgent. You can breathe.",
  "attention.resolve": "Mark as resolved",
  "attention.resolveAll": "Resolve all",
  "attention.resolved": "Resolved · {count}",
  "attention.undo": "Bring back",
  "attention.until": "due {date}",
  "attention.runFailed": "{task}: run failed",
  "attention.chargeFailed": "Automatic charge failed",
  "attention.invoices": "Invoices",

  "tasks.title": "Agents",
  "tasks.description": "Last run of each task",
  "tasks.empty": "No reports yet.",

  "activity.title": "Activity",
  "activity.empty": "Agent reports will show up here.",
  "activity.error": "error",
  "activity.openBrief": "Open brief",

  "apps.title": "Apps",
  "apps.empty": "Add apps to PULSE_APPS.",
  "apps.online": "online · {ms} ms",
  "apps.down": "unavailable",

  "appearance.label": "Appearance",
  "appearance.theme": "Theme",
  "appearance.light": "Light",
  "appearance.dark": "Dark",
  "appearance.system": "System",

  "wallpaper.label": "Background",
  "wallpaper.choose": "Choose background",
  "wallpaper.change": "Change background",
  "wallpaper.remove": "Remove background",
  "wallpaper.dim": "Dimming",

  "task.mail-scan": "Mail scan",
  "task.invoices": "Invoices",
  "task.morning-brief": "Morning brief",
  "task.pre-standup-brief": "Pre-standup brief",
  "task.weekly-review": "Weekly review",
} satisfies Record<string, Message>

export type MessageKey = keyof typeof en
export type Messages = Record<MessageKey, Message>
