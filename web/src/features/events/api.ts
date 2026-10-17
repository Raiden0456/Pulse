import { api } from "@/lib/api"
import type { PulseEvent } from "./types/event"

export const eventsApi = {
  list: (limit = 100) => api.get<PulseEvent[]>(`/api/events?limit=${limit}`),
  latest: () => api.get<PulseEvent[]>("/api/events/latest"),
}
