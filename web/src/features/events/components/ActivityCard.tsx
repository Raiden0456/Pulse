import type { ComponentProps } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ActivityIcon, ArrowUpRightIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { eventsApi } from "../api"
import type { PulseEvent } from "../types/event"
import { sourceLabel, taskLabel } from "../utils/labels"
import { briefPayload } from "../utils/payload"
import { relativeTime } from "../utils/time"

const PAGE_SIZE = 10

export function ActivityCard(props: ComponentProps<"div">) {
  const { t } = useI18n()
  const activity = useInfiniteQuery({
    queryKey: ["events", "activity"],
    queryFn: ({ pageParam }) => eventsApi.page(PAGE_SIZE, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => {
      const tail = last.at(-1)
      return last.length === PAGE_SIZE && tail ? `${tail.run_at}:${tail.id}` : undefined
    },
    refetchInterval: 60_000,
  })
  const events = activity.data?.pages.flat() ?? []

  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={ActivityIcon} tone="purple" />
        <CardTitle>{t("activity.title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("activity.empty")}</p>
        ) : (
          <ol className="relative flex flex-col gap-5 border-l pl-5">
            {events.map((e) => (
              <ActivityItem key={e.id} event={e} />
            ))}
          </ol>
        )}
        {activity.hasNextPage && (
          <Button variant="outline" size="sm" className="self-center" disabled={activity.isFetchingNextPage} onClick={() => activity.fetchNextPage()}>
            {t("activity.loadMore")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityItem({ event: e }: { event: PulseEvent }) {
  const { t } = useI18n()
  const brief = briefPayload(e)
  return (
    <li className="relative min-w-0 wrap-anywhere">
      <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{taskLabel(e.task)}</span>
        <Badge variant="outline">{sourceLabel(e.source)}</Badge>
        {e.status === "error" && <Badge variant="destructive">{t("activity.error")}</Badge>}
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
          {t("activity.openBrief")} <ArrowUpRightIcon className="size-3.5" />
        </a>
      )}
    </li>
  )
}
