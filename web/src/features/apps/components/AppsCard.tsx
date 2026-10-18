import type { ComponentProps } from "react"
import { AppWindowIcon, ArrowUpRightIcon, LayoutGridIcon } from "lucide-react"
import { IconChip } from "@/components/IconChip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"
import type { AppStatus } from "../types/app"
import { appLogo } from "../utils/appLogo"

export function AppsCard({ apps, ...props }: { apps: AppStatus[] } & ComponentProps<"div">) {
  const { t } = useI18n()
  return (
    <Card {...props}>
      <CardHeader className="flex flex-row items-center gap-3">
        <IconChip icon={LayoutGridIcon} tone="orange" />
        <CardTitle>{t("apps.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("apps.empty")}</p>
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
                {appLogo(app.name) ? (
                  <img src={appLogo(app.name)} alt="" className="size-8 rounded-lg" />
                ) : (
                  <AppWindowIcon className="size-5 text-hue-blue" />
                )}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{app.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={cn("size-2 rounded-full", app.up ? "bg-success-solid" : "bg-destructive")} />
                    {app.up ? t("apps.online", { ms: app.latency_ms }) : t("apps.down")}
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
