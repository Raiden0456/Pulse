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

export type ChargeStatus = "charged" | "scheduled" | "failed"

export type Invoice = {
  counterparty: string
  amount: number
  currency: string
  issued_at: string | null
  charge_at: string | null
  status: ChargeStatus
  note: string | null
}

export type NextCharge = {
  counterparty: string
  amount: number
  currency: string
  charge_at: string
}

export type InvoicesPayload = {
  month: string | null
  currency: string
  total: number | null
  previous_total: number | null
  by_counterparty: { name: string; amount: number }[]
  next_charge: NextCharge | null
  invoices: Invoice[]
  issues: string[]
}

export type BriefPayload = {
  artifact_url: string | null
  headline: string
  highlights: string[]
}
