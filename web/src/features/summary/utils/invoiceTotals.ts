import { invoicesPayload, type PulseEvent } from "@/features/events"

export type InvoiceTotals = { currency: string; paid: number; unpaid: number; overdue: number }

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0)

export function invoiceTotals(event: PulseEvent | undefined) {
  const payload = event ? invoicesPayload(event) : null
  if (!payload) return null
  const currencies = Object.keys(payload.totals)
  const currency = currencies.includes("EUR") ? "EUR" : currencies[0]
  const raw = currency ? payload.totals[currency] : undefined
  const totals: InvoiceTotals | null = raw ? { currency, paid: num(raw.paid), unpaid: num(raw.unpaid), overdue: num(raw.overdue) } : null
  const nextDue = payload.invoices
    .filter((i) => (i.state === "unpaid" || i.state === "overdue") && i.due_at)
    .map((i) => i.due_at as string)
    .sort()[0]
  return { totals, nextDue: nextDue ?? null, otherCurrencies: currencies.filter((c) => c !== currency) }
}

export function formatMoney(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${Math.round(amount)} ${currency}`
  }
}
