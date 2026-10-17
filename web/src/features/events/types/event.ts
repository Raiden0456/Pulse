export type PulseEvent = {
  id: number
  source: string
  task: string
  status: string
  summary: string
  payload: unknown
  run_at: number
}

export type Severity = "critical" | "warning"

export type MailItem = {
  severity: Severity
  from: string
  subject: string
  received_at: string
  reason: string
  action: string | null
  deadline: string | null
  link: string | null
}

export type MailScanPayload = {
  scanned: number
  items: MailItem[]
}

export type InvoiceState = "new" | "paid" | "unpaid" | "overdue"

export type Invoice = {
  counterparty: string
  number: string | null
  amount: number
  currency: string
  issued_at: string | null
  due_at: string | null
  state: InvoiceState
  note: string | null
}

export type InvoicesPayload = {
  invoices: Invoice[]
  totals: Record<string, { paid: number; unpaid: number; overdue: number }>
  issues: string[]
}

export type BriefPayload = {
  artifact_url: string | null
  headline: string
  highlights: string[]
}
