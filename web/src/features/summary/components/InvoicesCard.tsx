import type { ComponentProps } from "react"
import { ReceiptIcon } from "lucide-react"
import { StackedBar } from "@/components/StackedBar"
import { formatDate, invoicesPayload, relativeTime, type PulseEvent } from "@/features/events"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import { deltaPercent, formatMoney, monthLabel } from "../utils/invoiceTotals"
import { SummaryCard } from "./SummaryCard"

const shades = ["bg-primary", "bg-primary/70", "bg-primary/50", "bg-primary/35", "bg-primary/20"]
const SPIKE_PERCENT = 20

export function InvoicesCard({ latest, ...props }: { latest: PulseEvent | undefined } & ComponentProps<"div">) {
  const { t, locale } = useI18n()
  const data = latest ? invoicesPayload(latest) : null
  const base = {
    icon: ReceiptIcon,
    tone: "green" as const,
    title: t("summary.invoices.title"),
    aside: monthLabel(data?.month ?? null, locale),
    ...props,
  }

  if (!data || data.total === null) {
    return (
      <SummaryCard
        {...base}
        headline={t("summary.invoices.noTotals")}
        headlineTone="text-muted-foreground"
        footer={latest ? t("summary.invoices.lastReport", { when: relativeTime(latest.run_at) }) : undefined}
      />
    )
  }

  const money = (v: number, currency = data.currency) => formatMoney(v, currency, locale)
  const failed = data.invoices.filter((i) => i.status === "failed").length
  const delta = deltaPercent(data.total, data.previous_total)
  const parts = [...data.by_counterparty].sort((a, b) => b.amount - a.amount)
  const top = parts.slice(0, shades.length - 1)
  const rest = parts.slice(shades.length - 1).reduce((sum, p) => sum + p.amount, 0)
  const segments = [
    ...top.map((p, i) => ({ key: p.name, value: p.amount, className: shades[i], label: p.name })),
    ...(rest > 0 ? [{ key: "rest", value: rest, className: shades[shades.length - 1], label: t("summary.invoices.other") }] : []),
  ]

  return (
    <SummaryCard
      {...base}
      headline={failed > 0 ? t("summary.invoices.failed", { count: failed }) : t("summary.invoices.total", { amount: money(data.total) })}
      headlineTone={failed > 0 ? "text-destructive" : ""}
      visual={
        <div className="flex flex-col gap-1.5">
          <StackedBar segments={segments} />
          <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground tabular-nums">
            <span className="truncate">{top.slice(0, 3).map((p) => `${p.name} ${money(p.amount)}`).join(" · ")}</span>
            {delta !== null && (
              <span className={cn("ml-auto whitespace-nowrap", delta >= SPIKE_PERCENT && "text-warning")}>
                {t("summary.invoices.delta", { delta: `${delta > 0 ? "+" : ""}${delta}%` })}
              </span>
            )}
          </p>
        </div>
      }
      footer={
        data.next_charge
          ? t("summary.invoices.nextCharge", {
              name: data.next_charge.counterparty,
              amount: money(data.next_charge.amount, data.next_charge.currency),
              date: formatDate(data.next_charge.charge_at),
            })
          : t("summary.invoices.lastReport", { when: relativeTime(latest!.run_at) })
      }
    />
  )
}
