import { mailScanPayload, type PulseEvent } from "@/features/events"

export const WEEK_DAYS = 7

export type MailDay = { date: Date; critical: number; warning: number }

export function weekStart(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WEEK_DAYS - 1))
  return Math.floor(start.getTime() / 1000)
}

export function mailWeek(events: PulseEvent[], now = new Date()) {
  const days: MailDay[] = Array.from({ length: WEEK_DAYS }, (_, i) => ({
    date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - (WEEK_DAYS - 1 - i)),
    critical: 0,
    warning: 0,
  }))
  let scanned = 0
  for (const e of events) {
    const payload = mailScanPayload(e)
    if (!payload) continue
    scanned += typeof payload.scanned === "number" ? payload.scanned : 0
    const at = new Date(e.run_at * 1000)
    const day = days.find((d) => d.date.toDateString() === at.toDateString())
    if (!day) continue
    for (const item of payload.items) {
      if (item.severity === "critical") day.critical++
      else day.warning++
    }
  }
  return { days, scanned, today: days[WEEK_DAYS - 1] }
}
