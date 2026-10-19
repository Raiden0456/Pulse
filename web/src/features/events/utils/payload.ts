import type { BriefPayload, Invoice, InvoicesPayload, MailScanPayload, PulseEvent } from "../types/event"

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

export function mailScanPayload(event: PulseEvent): MailScanPayload | null {
  const p = event.payload
  if (event.task !== "mail-scan" || !isObject(p) || !Array.isArray(p.items)) return null
  return p as MailScanPayload
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const str = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v : null)

export function invoicesPayload(event: PulseEvent): InvoicesPayload | null {
  const p = event.payload
  if (event.task !== "invoices" || !isObject(p)) return null
  const next = isObject(p.next_charge) ? p.next_charge : null
  return {
    month: str(p.month),
    currency: str(p.currency) ?? "EUR",
    total: num(p.total),
    previous_total: num(p.previous_total),
    by_counterparty: Array.isArray(p.by_counterparty)
      ? p.by_counterparty.filter(isObject).flatMap((c) => (str(c.name) && num(c.amount) !== null ? [{ name: c.name as string, amount: c.amount as number }] : []))
      : [],
    next_charge:
      next && str(next.counterparty) && num(next.amount) !== null && str(next.charge_at)
        ? { counterparty: next.counterparty as string, amount: next.amount as number, currency: str(next.currency) ?? "EUR", charge_at: next.charge_at as string }
        : null,
    invoices: Array.isArray(p.invoices) ? (p.invoices.filter(isObject) as Invoice[]) : [],
    issues: Array.isArray(p.issues) ? p.issues.filter((i): i is string => typeof i === "string") : [],
  }
}

export function briefPayload(event: PulseEvent): BriefPayload | null {
  const p = event.payload
  if (!isObject(p) || !("artifact_url" in p || "headline" in p)) return null
  return {
    artifact_url: typeof p.artifact_url === "string" && p.artifact_url.startsWith("https://") ? p.artifact_url : null,
    headline: typeof p.headline === "string" ? p.headline : "",
    highlights: Array.isArray(p.highlights) ? p.highlights.filter((h): h is string => typeof h === "string") : [],
  }
}
