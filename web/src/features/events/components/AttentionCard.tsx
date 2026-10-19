import { useState, type ComponentProps } from "react"
import { ArrowUpRightIcon, BellRingIcon, CheckCheckIcon, CheckCircle2Icon, CheckIcon, ChevronDownIcon, CircleAlertIcon, RotateCcwIcon, TriangleAlertIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import { useResolved } from "../hooks/useResolved"
import type { AttentionItem } from "../utils/attention"
import { sourceLabel } from "../utils/labels"
import { formatDate, relativeTime } from "../utils/time"

export function AttentionCard({ items, ...props }: { items: AttentionItem[] } & ComponentProps<"div">) {
  const { t } = useI18n()
  const { resolvedKeys, resolve, unresolve } = useResolved()
  const [showResolved, setShowResolved] = useState(false)
  const open = items.filter((i) => !resolvedKeys.has(i.key))
  const resolved = items.filter((i) => resolvedKeys.has(i.key))

  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={BellRingIcon} tone="red" />
        <div>
          <CardTitle>{t("attention.title")}</CardTitle>
          <CardDescription>{t("attention.window")}</CardDescription>
        </div>
        {open.length > 1 && (
          <CardAction className="ml-auto self-center">
            <Button variant="ghost" size="sm" onClick={() => resolve(open.map((i) => i.key))}>
              <CheckCheckIcon />
              {t("attention.resolveAll")}
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {open.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4 text-sm">
            <CheckCircle2Icon className="size-5 text-success" />
            {t("attention.empty")}
          </div>
        ) : (
          <ul className="flex flex-col divide-y">
            {open.map((item) => (
              <AttentionRow key={item.key} item={item} onToggle={() => resolve([item.key])} />
            ))}
          </ul>
        )}

        {resolved.length > 0 && (
          <div className="flex flex-col gap-1 border-t pt-3">
            <button
              type="button"
              onClick={() => setShowResolved((v) => !v)}
              className="flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDownIcon className={cn("size-3.5 transition-transform", !showResolved && "-rotate-90")} />
              {t("attention.resolved", { count: resolved.length })}
            </button>
            {showResolved && (
              <ul className="mt-2 flex flex-col divide-y opacity-60">
                {resolved.map((item) => (
                  <AttentionRow key={item.key} item={item} resolved onToggle={() => unresolve(item.key)} />
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AttentionRow({ item, resolved = false, onToggle }: { item: AttentionItem; resolved?: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const critical = item.severity === "critical"
  const Icon = resolved ? CheckCircle2Icon : critical ? CircleAlertIcon : TriangleAlertIcon
  return (
    <li className="group flex gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className={cn("mt-0.5 size-5 shrink-0", resolved ? "text-muted-foreground" : critical ? "text-destructive" : "text-warning")} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className={cn("font-medium leading-snug", resolved && "line-through decoration-muted-foreground/50")}>{item.title}</span>
          <div className="-mt-1 -mr-2 flex shrink-0 items-center">
            {item.link && (
              <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground">
                <a href={item.link} target="_blank" rel="noreferrer" aria-label={t("common.open")} title={t("common.open")}>
                  <ArrowUpRightIcon />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggle}
              aria-label={resolved ? t("attention.undo") : t("attention.resolve")}
              title={resolved ? t("attention.undo") : t("attention.resolve")}
              className="text-muted-foreground hover:text-success"
            >
              {resolved ? <RotateCcwIcon /> : <CheckIcon />}
            </Button>
          </div>
        </div>
        {!resolved && (
          <>
            <p className="text-sm text-muted-foreground">{item.detail}</p>
            {item.action && <p className="text-sm">→ {item.action}</p>}
          </>
        )}
        <p className="text-xs text-muted-foreground">
          {sourceLabel(item.source)} · {relativeTime(item.at)}
          {!resolved && item.deadline && <span className="text-destructive"> · {t("attention.until", { date: formatDate(item.deadline) })}</span>}
        </p>
      </div>
    </li>
  )
}
