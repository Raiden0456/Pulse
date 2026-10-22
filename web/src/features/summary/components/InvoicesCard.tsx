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
const LEGEND_ROWS = 3

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
  const legend = parts.slice(0, LEGEND_ROWS)
  const legendRest = parts.slice(LEGEND_ROWS).reduce((sum, p) => sum + p.amount, 0)
  const segments = [
    ...top.map((p, i) => ({ key: p.name, value: p.amount, className: shades[i], label: p.name })),
    ...(rest > 0 ? [{ key: "rest", value: rest, className: shades[shades.length - 1], label: t("summary.invoices.other") }] : []),
  ]

  return (
    <SummaryCard
      {...base}
      headline={
        <>
          {failed > 0 ? t("summary.invoices.failed", { count: failed }) : t("summary.invoices.total", { amount: money(data.total) })}
          {delta !== null && (
            <span className={cn("mt-1 block text-xs font-normal", delta >= SPIKE_PERCENT ? "text-warning" : "text-muted-foreground")}>
              {t("summary.invoices.delta", { delta: `${delta > 0 ? "+" : ""}${delta}%` })}
            </span>
          )}
        </>
      }
      headlineTone={failed > 0 ? "text-destructive" : ""}
      visual={
        <div className="flex flex-col gap-1.5">
          <StackedBar segments={segments} />
          <ul className="flex flex-col gap-1 text-xs">
            {legend.map((p, i) => (
              <LegendRow key={p.name} swatch={shades[i]} name={p.name} amount={money(p.amount)} />
            ))}
            {legendRest > 0 && <LegendRow swatch={shades[LEGEND_ROWS]} name={t("summary.invoices.other")} amount={money(legendRest)} />}
          </ul>
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

function LegendRow({ swatch, name, amount }: { swatch: string; name: string; amount: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("size-2 shrink-0 rounded-full", swatch)} />
      <span className="min-w-0 flex-1 truncate text-muted-foreground">{name}</span>
      <span className="shrink-0 tabular-nums">{amount}</span>
    </li>
  )
}
