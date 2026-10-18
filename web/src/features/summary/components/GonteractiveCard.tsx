import type { ComponentProps } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2Icon, FlameIcon, GraduationCapIcon } from "lucide-react"
import { appLogo } from "@/features/apps"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import { summaryApi } from "../api"
import type { GonteractiveSummary } from "../types/summary"
import { SummaryCard } from "./SummaryCard"

export function GonteractiveCard(props: ComponentProps<"div">) {
  const { t, locale } = useI18n()
  const summary = useQuery({ queryKey: ["summary", "gonteractive"], queryFn: summaryApi.gonteractive, refetchInterval: 60_000 })
  const base = { icon: GraduationCapIcon, tone: "purple" as const, logo: appLogo("burrow"), title: t("summary.go.title"), ...props }
  const data = summary.data

  if (!data?.configured) return <SummaryCard {...base} headline={t("summary.go.notConfigured")} headlineTone="text-muted-foreground" />
  if (!data.available) return <SummaryCard {...base} href={data.url} headline={t("summary.go.unavailable")} headlineTone="text-muted-foreground" />

  const [headline, tone] = dailyHeadline(data, t, locale)
  const activity = data.activity ?? []
  const peak = Math.max(1, ...activity)

  return (
    <SummaryCard
      {...base}
      href={data.url}
      aside={
        data.streak > 0 && (
          <span title={t("summary.go.streak", { count: data.streak })} className="flex items-center gap-1 whitespace-nowrap rounded-full bg-hue-orange/15 px-2 py-0.5 font-medium tabular-nums text-hue-orange">
            <FlameIcon className="size-3.5" />
            {data.streak}
          </span>
        )
      }
      headline={
        data.daily.state === "done" ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle2Icon className="size-5 shrink-0" />
            {headline}
          </span>
        ) : (
          headline
        )
      }
      headlineTone={tone}
      visual={
        <div className="flex h-10 items-end gap-1">
          {activity.map((count, i) => (
            <div key={i} className="flex h-full flex-1 items-end justify-center">
              <div
                className={cn("w-3 rounded-sm", count ? "bg-primary" : "h-0.5 rounded-full bg-muted-foreground/30")}
                style={count ? { height: `${Math.max(15, (count / peak) * 100)}%`, opacity: 0.4 + 0.6 * (count / peak) } : undefined}
              />
            </div>
          ))}
        </div>
      }
      footer={t("summary.go.footer", { due: data.due_count, answers: data.answers_today })}
    />
  )
}

function dailyHeadline(data: GonteractiveSummary, t: ReturnType<typeof useI18n>["t"], locale: string): [string, string] {
  const { daily } = data
  switch (daily.state) {
    case "done":
      return [daily.score === null ? t("summary.go.done") : t("summary.go.doneScore", { score: Math.round(daily.score * 100) }), "text-success"]
    case "in_progress":
      return [t("summary.go.inProgress", { answered: daily.answered, total: daily.total }), "text-warning"]
    case "scheduled":
      return daily.scheduled_at * 1000 > Date.now()
        ? [t("summary.go.scheduledAt", { time: new Date(daily.scheduled_at * 1000).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) }), ""]
        : [t("summary.go.preparing"), "text-muted-foreground"]
    case "off":
      return data.active_today ? [t("summary.go.active"), "text-success"] : [t("summary.go.idle"), "text-muted-foreground"]
  }
}
