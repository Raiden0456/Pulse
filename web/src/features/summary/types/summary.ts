export type JobSearchSummary = {
  url: string
  configured: boolean
  available: boolean
  statuses: Record<string, number> | null
  stale: number
  shortlist: { total: number; strong: number; good: number }
}

export type DailyState = "off" | "scheduled" | "in_progress" | "done"

export type GonteractiveSummary = {
  url: string
  configured: boolean
  available: boolean
  streak: number
  active_today: boolean
  answers_today: number
  due_count: number
  activity: number[] | null
  daily: {
    state: DailyState
    answered: number
    total: number
    score: number | null
    scheduled_at: number
  }
}
