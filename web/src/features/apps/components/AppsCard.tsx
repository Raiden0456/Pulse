import type { ComponentProps } from "react"
import { AppWindowIcon, ArrowUpRightIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { AppStatus } from "../types/app"

export function AppsCard({ apps, ...props }: { apps: AppStatus[] } & ComponentProps<"div">) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Приложения</CardTitle>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Добавь приложения в PULSE_APPS.</p>
        ) : (
          <div className="grid gap-2">
            {apps.map((app) => (
              <a
                key={app.url}
                href={app.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <AppWindowIcon className="size-5 text-hue-blue" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-2 rounded-full", app.up ? "bg-success" : "bg-destructive")} />
                    {app.up ? `онлайн · ${app.latency_ms} мс` : "недоступно"}
                  </span>
                </div>
                <ArrowUpRightIcon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
