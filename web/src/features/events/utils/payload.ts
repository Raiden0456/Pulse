import type { BriefPayload, InvoicesPayload, MailScanPayload, PulseEvent } from "../types/event"

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null

export function mailScanPayload(event: PulseEvent): MailScanPayload | null {
  const p = event.payload
  if (event.task !== "mail-scan" || !isObject(p) || !Array.isArray(p.items)) return null
  return p as MailScanPayload
}

export function invoicesPayload(event: PulseEvent): InvoicesPayload | null {
  const p = event.payload
  if (event.task !== "invoices" || !isObject(p) || !Array.isArray(p.invoices)) return null
  return {
    invoices: p.invoices as InvoicesPayload["invoices"],
    totals: isObject(p.totals) ? (p.totals as InvoicesPayload["totals"]) : {},
    issues: Array.isArray(p.issues) ? (p.issues as string[]) : [],
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
