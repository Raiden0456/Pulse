import type { ComponentProps } from "react"
import { ArrowUpRightIcon, BotIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import type { PulseEvent } from "../types/event"
import { sourceLabel, taskLabel } from "../utils/labels"
import { briefPayload } from "../utils/payload"
import { isStale } from "../utils/stale"
import { relativeTime } from "../utils/time"

export function TasksCard({ latest, ...props }: { latest: PulseEvent[] } & ComponentProps<"div">) {
  const { t } = useI18n()
  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={BotIcon} tone="yellow" />
        <div>
          <CardTitle>{t("tasks.title")}</CardTitle>
          <CardDescription>{t("tasks.description")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("tasks.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {latest.map((e) => {
              const stale = isStale(e.task, e.run_at)
              const failed = e.status === "error"
              const brief = briefPayload(e)
              const row = (
                <>
                  <span className={cn("size-2.5 shrink-0 rounded-full", failed ? "bg-destructive" : stale ? "bg-warning-solid" : "bg-success-solid")} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {taskLabel(e.task)}
                      {brief?.artifact_url && <ArrowUpRightIcon className="size-3.5 text-muted-foreground group-hover:text-foreground" />}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{brief?.headline || sourceLabel(e.source)}</span>
                  </div>
                  <span className={cn("shrink-0 text-xs", stale ? "text-warning" : "text-muted-foreground")}>{relativeTime(e.run_at)}</span>
                </>
              )
              return (
                <li key={`${e.source}-${e.task}`}>
                  {brief?.artifact_url ? (
                    <a href={brief.artifact_url} target="_blank" rel="noreferrer" className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted/60">
                      {row}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 py-1">{row}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
