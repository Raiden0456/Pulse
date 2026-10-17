import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = ComponentProps<"div"> & {
  icon: LucideIcon
  value: string
  label: string
  tone?: string
}

export function StatTile({ icon: Icon, value, label, tone = "text-muted-foreground", className, ...props }: Props) {
  return (
    <Card className={cn("flex flex-col gap-1 p-4", className)} {...props}>
      <Icon className={cn("size-5", tone)} />
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  )
}
