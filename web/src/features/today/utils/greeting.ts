import type { MessageKey } from "@/i18n"

export function greetingKey(hour: number): MessageKey {
  if (hour >= 5 && hour < 12) return "today.morning"
  if (hour >= 12 && hour < 18) return "today.afternoon"
  if (hour >= 18 && hour < 23) return "today.evening"
  return "today.night"
}
