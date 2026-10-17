import { cn } from "@/lib/utils"

export type BarSegment = { key: string; value: number; className: string; label: string }

export function StackedBar({ segments, className }: { segments: BarSegment[]; className?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  return (
    <div className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-muted", className)}>
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => <div key={s.key} title={`${s.label}: ${s.value}`} className={cn("h-full first:rounded-l-full last:rounded-r-full", s.className)} style={{ width: `${(s.value / total) * 100}%` }} />)}
    </div>
  )
}
