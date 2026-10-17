import type { ComponentProps } from "react"
import { ArrowUpRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PulseEvent } from "../types/event"
import { sourceLabel, taskLabel } from "../utils/labels"
import { briefPayload } from "../utils/payload"
import { relativeTime } from "../utils/time"

export function ActivityCard({ events, ...props }: { events: PulseEvent[] } & ComponentProps<"div">) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Активность</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Тут появятся отчёты агентов.</p>
        ) : (
          <ol className="relative flex flex-col gap-5 border-l pl-5">
            {events.map((e) => (
              <ActivityItem key={e.id} event={e} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityItem({ event: e }: { event: PulseEvent }) {
  const brief = briefPayload(e)
  return (
    <li className="relative">
      <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{taskLabel(e.task)}</span>
        <Badge variant="outline">{sourceLabel(e.source)}</Badge>
        {e.status === "error" && <Badge variant="destructive">ошибка</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">{relativeTime(e.run_at)}</span>
      </div>
      {brief?.headline && <p className="mt-1 text-sm font-medium">{brief.headline}</p>}
      <p className="mt-1 text-sm text-muted-foreground">{e.summary}</p>
      {brief && brief.highlights.length > 0 && (
        <ul className="mt-2 flex list-disc flex-col gap-1 pl-4 text-sm">
          {brief.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      {brief?.artifact_url && (
        <a href={brief.artifact_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-hue-blue hover:underline">
          Открыть брифинг <ArrowUpRightIcon className="size-3.5" />
        </a>
      )}
    </li>
  )
}
