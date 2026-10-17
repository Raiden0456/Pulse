export type JobSearchSummary = {
  url: string
  configured: boolean
  available: boolean
  statuses: Record<string, number> | null
  stale: number
  shortlist: { total: number; strong: number; good: number }
}
