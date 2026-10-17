const HOUR = 60 * 60

const staleAfter: Record<string, number> = {
  "morning-brief": 4 * 24 * HOUR,
  "pre-standup-brief": 4 * 24 * HOUR,
  "weekly-review": 8 * 24 * HOUR,
}

const DEFAULT_STALE_AFTER = 36 * HOUR

export const isStale = (task: string, runAt: number, now = Date.now() / 1000) => now - runAt > (staleAfter[task] ?? DEFAULT_STALE_AFTER)
