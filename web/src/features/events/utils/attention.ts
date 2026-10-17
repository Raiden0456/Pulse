import { t } from "@/i18n"
import type { PulseEvent, Severity } from "../types/event"
import { taskLabel } from "./labels"
import { invoicesPayload, mailScanPayload } from "./payload"

export const ATTENTION_WINDOW_SECONDS = 3 * 24 * 60 * 60

export type AttentionItem = {
  key: string
  severity: Severity
  title: string
  detail: string
  action: string | null
  deadline: string | null
  link: string | null
  source: string
  at: number
}

export function attentionItems(events: PulseEvent[], now = Date.now() / 1000): AttentionItem[] {
  const recent = events.filter((e) => now - e.run_at <= ATTENTION_WINDOW_SECONDS)
  const items = recent.flatMap((e) => fromEvent(e))
  return items.sort((a, b) => rank(a.severity) - rank(b.severity) || b.at - a.at)
}

function fromEvent(e: PulseEvent): AttentionItem[] {
  const base = { source: e.source, at: e.run_at }
  if (e.status === "error") {
    return [{ ...base, key: `${e.id}-error`, severity: "critical", title: t("attention.runFailed", { task: taskLabel(e.task) }), detail: e.summary, action: null, deadline: null, link: null }]
  }

  const mail = mailScanPayload(e)
  if (mail) {
    return mail.items.map((item, i) => ({
      ...base,
      key: `${e.id}-mail-${i}`,
      severity: item.severity === "critical" ? "critical" : "warning",
      title: item.subject,
      detail: `${item.from} · ${item.reason}`,
      action: item.action,
      deadline: item.deadline,
      link: item.link,
    }))
  }

  const inv = invoicesPayload(e)
  if (inv) {
    const unpaid = inv.invoices
      .filter((i) => i.state === "overdue" || i.state === "unpaid")
      .map((i, n): AttentionItem => ({
        ...base,
        key: `${e.id}-inv-${n}`,
        severity: i.state === "overdue" ? "critical" : "warning",
        title: `${i.counterparty}: ${i.amount} ${i.currency}`,
        detail: t(i.state === "overdue" ? "attention.overdue" : "attention.unpaid"),
        action: i.note,
        deadline: i.due_at,
        link: null,
      }))
    const issues = inv.issues.map((issue, n): AttentionItem => ({
      ...base,
      key: `${e.id}-issue-${n}`,
      severity: "warning",
      title: t("attention.invoices"),
      detail: issue,
      action: null,
      deadline: null,
      link: null,
    }))
    return [...unpaid, ...issues]
  }
  return []
}

const rank = (s: Severity) => (s === "critical" ? 0 : 1)
