import { api } from "@/lib/api"
import type { PulseEvent } from "@/features/events"
import type { JobSearchSummary } from "./types/summary"

export const summaryApi = {
  jobSearch: () => api.get<JobSearchSummary>("/api/summary/jobsearch"),
  taskSince: (task: string, since: number) => api.get<PulseEvent[]>(`/api/events?task=${encodeURIComponent(task)}&since=${since}`),
}
