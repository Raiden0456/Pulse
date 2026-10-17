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
  "today.statAttention": "need attention",
  "today.statCritical": { one: "need attention · {count} critical", other: "need attention · {count} critical" },
  "today.statAgents": "agents healthy",
  "today.statApps": "apps online",

  "attention.title": "Needs attention",
  "attention.window": "Last 3 days",
  "attention.empty": "Nothing urgent. You can breathe.",
  "attention.until": "due {date}",
  "attention.runFailed": "{task}: run failed",
  "attention.overdue": "Overdue",
  "attention.unpaid": "Unpaid",
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
