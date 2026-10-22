import type { ComponentProps } from "react"
import { ArrowUpRightIcon, NewspaperIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getLocale, useI18n } from "@/i18n"
import type { CurrentBrief } from "../utils/currentBrief"
import { sourceLabel, taskLabel } from "../utils/labels"

export function BriefCard({ current, ...props }: { current: CurrentBrief } & ComponentProps<"div">) {
  const { t } = useI18n()
  const { event, brief } = current
  const time = new Date(event.run_at * 1000).toLocaleTimeString(getLocale(), { hour: "2-digit", minute: "2-digit" })

  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={NewspaperIcon} tone="blue" />
        <div className="min-w-0">
          <CardTitle>{taskLabel(event.task)}</CardTitle>
          <CardDescription>
            {sourceLabel(event.source)} · {time}
          </CardDescription>
        </div>
        {brief.artifact_url && (
          <CardAction className="ml-auto self-center">
            <Button asChild size="sm">
              <a href={brief.artifact_url} target="_blank" rel="noreferrer">
                {t("brief.open")}
                <ArrowUpRightIcon />
              </a>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-2 wrap-anywhere">
        {brief.headline && <p className="text-base font-semibold leading-snug">{brief.headline}</p>}
        {brief.highlights.length > 0 ? (
          <ul className="grid list-disc gap-x-8 gap-y-1 pl-4 text-sm md:grid-cols-2">
            {brief.highlights.slice(0, 6).map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{event.summary}</p>
        )}
      </CardContent>
    </Card>
  )
}
