import { api } from "@/lib/api"
import type { AppStatus } from "./types/app"

export const appsApi = {
  list: () => api.get<AppStatus[]>("/api/apps"),
}
