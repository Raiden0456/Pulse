import type { JobSearchSummary } from "../types/summary"

export type FunnelStage = "drafted" | "applied" | "interview" | "offer" | "closed"

export const FUNNEL_STAGES: FunnelStage[] = ["drafted", "applied", "interview", "offer", "closed"]

const stageOf: Record<string, FunnelStage> = {
  drafted: "drafted",
  applied: "applied",
  interview: "interview",
  offer: "offer",
  hired: "offer",
}

export function funnel(summary: JobSearchSummary): Record<FunnelStage, number> {
  const out: Record<FunnelStage, number> = { drafted: 0, applied: 0, interview: 0, offer: 0, closed: 0 }
  for (const [status, count] of Object.entries(summary.statuses ?? {})) {
    out[stageOf[status] ?? "closed"] += count
  }
  return out
}
