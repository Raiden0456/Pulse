import { api } from "@/lib/api"
import type { PulseEvent } from "./types/event"
import type { ResolvedItem } from "./types/resolved"

export const eventsApi = {
  list: (limit = 100) => api.get<PulseEvent[]>(`/api/events?limit=${limit}`),
  latest: () => api.get<PulseEvent[]>("/api/events/latest"),
  resolved: () => api.get<ResolvedItem[]>("/api/attention/resolved"),
  resolve: (key: string) => api.put<void>(`/api/attention/resolved/${encodeURIComponent(key)}`, {}),
  unresolve: (key: string) => api.delete(`/api/attention/resolved/${encodeURIComponent(key)}`),
}
