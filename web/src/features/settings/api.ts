import { api } from "@/lib/api"
import type { InterfaceSettings } from "./types/interface"

export const settingsApi = {
  interface: () => api.get<InterfaceSettings>("/api/settings/interface"),
  saveInterface: (ui: InterfaceSettings) => api.put<InterfaceSettings>("/api/settings/interface", ui),
}
