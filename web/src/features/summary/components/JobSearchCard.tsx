import type { ComponentProps } from "react"
import { useQuery } from "@tanstack/react-query"
import { BriefcaseBusinessIcon } from "lucide-react"
import { StackedBar } from "@/components/StackedBar"
import { appLogo } from "@/features/apps"
import { useI18n } from "@/i18n"
import { summaryApi } from "../api"
import { FUNNEL_STAGES, funnel, type FunnelStage } from "../utils/jobFunnel"
import { SummaryCard } from "./SummaryCard"

const stageTone: Record<FunnelStage, string> = {
  drafted: "bg-primary/30",
  applied: "bg-primary/55",
  interview: "bg-primary/80",
  offer: "bg-primary",
  closed: "bg-muted-foreground/20",
}

export function JobSearchCard(props: ComponentProps<"div">) {
  const { t } = useI18n()
  const summary = useQuery({ queryKey: ["summary", "jobsearch"], queryFn: summaryApi.jobSearch, refetchInterval: 5 * 60_000 })
  const base = { icon: BriefcaseBusinessIcon, tone: "blue" as const, logo: appLogo("scout"), title: t("summary.jobs.title"), ...props }
  const data = summary.data

  if (!data?.configured) return <SummaryCard {...base} headline={t("summary.jobs.notConfigured")} headlineTone="text-muted-foreground" />
  if (!data.available) return <SummaryCard {...base} href={data.url} headline={t("summary.jobs.unavailable")} headlineTone="text-muted-foreground" />

  const stages = funnel(data)
  const [headline, tone] =
    data.stale > 0
      ? [t("summary.jobs.stale", { count: data.stale }), "text-warning"]
      : stages.drafted > 0
        ? [t("summary.jobs.drafted", { count: stages.drafted }), ""]
        : stages.interview > 0
          ? [t("summary.jobs.interview", { count: stages.interview }), "text-primary"]
          : stages.applied > 0
            ? [t("summary.jobs.waiting", { count: stages.applied }), ""]
            : [t("summary.jobs.clear"), "text-muted-foreground"]

  return (
    <SummaryCard
      {...base}
      href={data.url}
      headline={headline}
      headlineTone={tone}
      visual={
        <div className="flex flex-col gap-1.5">
          <StackedBar segments={FUNNEL_STAGES.map((s) => ({ key: s, value: stages[s], className: stageTone[s], label: t(`summary.jobs.stage.${s}`) }))} />
          <p className="text-xs text-muted-foreground tabular-nums">
            {FUNNEL_STAGES.filter((s) => s !== "closed")
              .map((s) => `${t(`summary.jobs.stage.${s}`)} ${stages[s]}`)
              .join(" · ")}
          </p>
        </div>
      }
      footer={data.shortlist.total > 0 ? t("summary.jobs.shortlist", { count: data.shortlist.total, strong: data.shortlist.strong }) : undefined}
    />
  )
}
