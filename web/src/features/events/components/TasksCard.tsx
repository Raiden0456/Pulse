import type { ComponentProps } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import type { PulseEvent } from "../types/event"
import { sourceLabel, taskLabel } from "../utils/labels"
import { isStale } from "../utils/stale"
import { relativeTime } from "../utils/time"

export function TasksCard({ latest, ...props }: { latest: PulseEvent[] } & ComponentProps<"div">) {
  const { t } = useI18n()
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("tasks.title")}</CardTitle>
        <CardDescription>{t("tasks.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {latest.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("tasks.empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {latest.map((e) => {
              const stale = isStale(e.task, e.run_at)
              const failed = e.status === "error"
              return (
                <li key={`${e.source}-${e.task}`} className="flex items-center gap-3">
                  <span className={cn("size-2.5 shrink-0 rounded-full", failed ? "bg-destructive" : stale ? "bg-warning" : "bg-success")} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{taskLabel(e.task)}</span>
                    <span className="text-xs text-muted-foreground">{sourceLabel(e.source)}</span>
                  </div>
                  <span className={cn("text-xs", stale ? "text-warning" : "text-muted-foreground")}>{relativeTime(e.run_at)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
