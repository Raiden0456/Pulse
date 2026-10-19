import type { BriefPayload, PulseEvent } from "../types/event"
import { briefPayload } from "./payload"

export type CurrentBrief = { event: PulseEvent; brief: BriefPayload }

export function currentBrief(latest: PulseEvent[], now = new Date()): CurrentBrief | null {
  const today = now.toDateString()
  let best: CurrentBrief | null = null
  for (const event of latest) {
    const brief = briefPayload(event)
    if (!brief || event.status === "error") continue
    if (new Date(event.run_at * 1000).toDateString() !== today) continue
    if (!best || event.run_at > best.event.run_at) best = { event, brief }
  }
  return best
}
