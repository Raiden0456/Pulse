import type { ComponentProps } from "react"
import { ReceiptIcon } from "lucide-react"
import { StackedBar } from "@/components/StackedBar"
import { formatDate, relativeTime, type PulseEvent } from "@/features/events"
import { useI18n } from "@/i18n"
import { formatMoney, invoiceTotals } from "../utils/invoiceTotals"
import { SummaryCard } from "./SummaryCard"

export function InvoicesCard({ latest, ...props }: { latest: PulseEvent | undefined } & ComponentProps<"div">) {
  const { t, locale } = useI18n()
  const base = {
    icon: ReceiptIcon,
    iconTone: "text-hue-green",
    title: t("summary.invoices.title"),
    aside: new Date().toLocaleDateString(locale, { month: "long" }),
    ...props,
  }
  const data = invoiceTotals(latest)

  if (!data?.totals) {
    return (
      <SummaryCard
        {...base}
        headline={t("summary.invoices.noTotals")}
        headlineTone="text-muted-foreground"
        footer={latest ? t("summary.invoices.lastReport", { when: relativeTime(latest.run_at) }) : undefined}
      />
    )
  }

  const { currency, paid, unpaid, overdue } = data.totals
  const due = unpaid + overdue
  const money = (v: number) => formatMoney(v, currency, locale)
  const [headline, tone] =
    overdue > 0
      ? [t("summary.invoices.overdue", { amount: money(overdue) }), "text-destructive"]
      : due > 0
        ? [t("summary.invoices.due", { amount: money(due) }), "text-warning"]
        : [t("summary.invoices.allPaid"), "text-success"]

  return (
    <SummaryCard
      {...base}
      headline={headline}
      headlineTone={tone}
      visual={
        <div className="flex flex-col gap-1.5">
          <StackedBar
            segments={[
              { key: "paid", value: paid, className: "bg-success", label: t("summary.invoices.paid") },
              { key: "unpaid", value: unpaid, className: "bg-warning", label: t("summary.invoices.unpaid") },
              { key: "overdue", value: overdue, className: "bg-destructive", label: t("summary.invoices.overdueLabel") },
            ]}
          />
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("summary.invoices.paid")} {money(paid)} · {t("summary.invoices.unpaid")} {money(due)}
          </p>
        </div>
      }
      footer={data.nextDue ? t("summary.invoices.nextDue", { date: formatDate(data.nextDue) }) : t("summary.invoices.lastReport", { when: relativeTime(latest!.run_at) })}
    />
  )
}
