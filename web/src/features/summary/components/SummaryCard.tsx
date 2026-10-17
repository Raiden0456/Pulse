import type { ComponentProps, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRightIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = ComponentProps<"div"> & {
  icon: LucideIcon
  iconTone: string
  title: string
  aside?: ReactNode
  headline: ReactNode
  headlineTone?: string
  visual?: ReactNode
  footer?: ReactNode
  href?: string
}

export function SummaryCard({ icon: Icon, iconTone, title, aside, headline, headlineTone, visual, footer, href, className, ...props }: Props) {
  return (
    <Card className={cn("relative flex flex-col gap-3 p-4", className)} {...props}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={cn("size-4", iconTone)} />
        <span className="font-medium">{title}</span>
        <span className="ml-auto">{aside}</span>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" aria-label={title} className="after:absolute after:inset-0 hover:text-foreground">
            <ArrowUpRightIcon className="size-3.5" />
          </a>
        )}
      </div>
      <p className={cn("text-lg font-semibold leading-tight", headlineTone)}>{headline}</p>
      {visual}
      {footer && <p className="mt-auto text-xs text-muted-foreground">{footer}</p>}
    </Card>
  )
}
