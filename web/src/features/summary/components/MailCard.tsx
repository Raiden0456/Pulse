import type { ComponentProps } from "react"
import { useQuery } from "@tanstack/react-query"
import { MailIcon } from "lucide-react"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import { summaryApi } from "../api"
import { mailWeek, weekStart } from "../utils/mailWeek"
import { SummaryCard } from "./SummaryCard"

export function MailCard(props: ComponentProps<"div">) {
  const { t, locale } = useI18n()
  const since = weekStart()
  const events = useQuery({ queryKey: ["summary", "mail", since], queryFn: () => summaryApi.taskSince("mail-scan", since), refetchInterval: 60_000 })
  const { days, scanned, today } = mailWeek(events.data ?? [])
  const peak = Math.max(1, ...days.map((d) => d.critical + d.warning))
  const weekWarnings = days.reduce((sum, d) => sum + d.warning, 0)
  const weekCritical = days.reduce((sum, d) => sum + d.critical, 0)

  const [headline, tone] =
    today.critical > 0
      ? [t("summary.mail.criticalToday", { count: today.critical }), "text-destructive"]
      : today.warning > 0
        ? [t("summary.mail.warningsToday", { count: today.warning }), "text-warning"]
        : [t("summary.mail.calm"), ""]

  return (
    <SummaryCard
      icon={MailIcon}
      tone="cyan"
      title={t("summary.mail.title")}
      aside={t("summary.week")}
      headline={headline}
      headlineTone={tone}
      visual={
        <div className="flex h-14 items-end gap-1">
          {days.map((d) => {
            const total = d.critical + d.warning
            const label = d.date.toLocaleDateString(locale, { weekday: "short", day: "numeric" })
            return (
              <div key={d.date.toISOString()} title={`${label}: ${d.critical} / ${d.warning}`} className="flex h-full flex-1 flex-col items-center justify-end">
                {total === 0 ? (
                  <div className="h-0.5 w-3 rounded-full bg-muted-foreground/30" />
                ) : (
                  <div className="flex w-3 flex-col overflow-hidden rounded-sm" style={{ height: `${Math.max(15, (total / peak) * 100)}%` }}>
                    <div className="bg-destructive" style={{ flexGrow: d.critical }} />
                    <div className="bg-warning-solid" style={{ flexGrow: d.warning }} />
                  </div>
                )}
                <span className={cn("mt-1 text-center text-[10px] leading-none text-muted-foreground", d === today && "font-semibold text-foreground")}>
                  {d.date.toLocaleDateString(locale, { weekday: "narrow" })}
                </span>
              </div>
            )
          })}
        </div>
      }
      footer={t("summary.mail.footer", { scanned, critical: weekCritical, warnings: weekWarnings })}
      {...props}
    />
  )
}
