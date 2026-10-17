import type { ComponentProps } from "react"
import { ArrowUpRightIcon, BellRingIcon, CheckCircle2Icon, CircleAlertIcon, TriangleAlertIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import type { AttentionItem } from "../utils/attention"
import { sourceLabel } from "../utils/labels"
import { formatDate, relativeTime } from "../utils/time"

export function AttentionCard({ items, ...props }: { items: AttentionItem[] } & ComponentProps<"div">) {
  const { t } = useI18n()
  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={BellRingIcon} tone="red" />
        <div>
          <CardTitle>{t("attention.title")}</CardTitle>
          <CardDescription>{t("attention.window")}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4 text-sm">
            <CheckCircle2Icon className="size-5 text-success" />
            {t("attention.empty")}
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {items.map((item) => (
              <AttentionRow key={item.key} item={item} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function AttentionRow({ item }: { item: AttentionItem }) {
  const { t } = useI18n()
  const critical = item.severity === "critical"
  const Icon = critical ? CircleAlertIcon : TriangleAlertIcon
  return (
    <li className="flex gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className={cn("mt-0.5 size-5 shrink-0", critical ? "text-destructive" : "text-warning")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium leading-snug">{item.title}</span>
          {item.link && (
            <a href={item.link} target="_blank" rel="noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label={t("common.open")}>
              <ArrowUpRightIcon className="size-4" />
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{item.detail}</p>
        {item.action && <p className="text-sm">→ {item.action}</p>}
        <p className="text-xs text-muted-foreground">
          {sourceLabel(item.source)} · {relativeTime(item.at)}
          {item.deadline && <span className="text-destructive"> · {t("attention.until", { date: formatDate(item.deadline) })}</span>}
        </p>
      </div>
    </li>
  )
}
