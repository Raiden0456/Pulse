import { useMutation, useQuery } from "@tanstack/react-query"
import { LogOutIcon } from "lucide-react"
import { ErrorAlert } from "@/components/ErrorAlert"
import { PageLoader } from "@/components/PageLoader"
import { Button } from "@/components/ui/button"
import { AppsCard, appsApi } from "@/features/apps"
import { authApi } from "@/features/auth"
import { ActivityCard, AttentionCard, TasksCard, attentionItems, eventsApi } from "@/features/events"
import { LanguageToggle, useInterface, useInterfaceSync } from "@/features/settings"
import { InvoicesCard, JobSearchCard, MailCard } from "@/features/summary"
import { AppearanceMenu, WallpaperBackdrop, useWallpaper } from "@/features/wallpaper"
import { useI18n } from "@/i18n"
import { enter } from "@/lib/enter"
import { greetingKey } from "../utils/greeting"

const REFRESH_MS = 60_000

export function TodayPage() {
  const { t, locale } = useI18n()
  useInterfaceSync()
  const ui = useInterface()
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsApi.list(), refetchInterval: REFRESH_MS })
  const latest = useQuery({ queryKey: ["events", "latest"], queryFn: eventsApi.latest, refetchInterval: REFRESH_MS })
  const apps = useQuery({ queryKey: ["apps"], queryFn: appsApi.list, refetchInterval: REFRESH_MS })
  const wallpaper = useWallpaper()
  const logout = useMutation({ mutationFn: authApi.logout, onSuccess: () => window.location.assign("/login") })

  if (events.isPending || latest.isPending || wallpaper.info.isPending || ui.query.isPending) return <PageLoader />

  const now = new Date()
  const attention = attentionItems(events.data ?? [])

  return (
    <>
      {wallpaper.version && <WallpaperBackdrop version={wallpaper.version} dim={ui.dim} />}
      <div data-wallpaper={wallpaper.version ? "" : undefined} className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-8">
        <header {...enter(0)} className="enter flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-8" />
            <span className="bg-gradient-to-r from-hue-blue to-hue-purple bg-clip-text font-semibold tracking-tight text-transparent">Pulse</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <AppearanceMenu />
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} aria-label={t("auth.logout")}>
              <LogOutIcon />
            </Button>
          </div>
        </header>

        <section {...enter(1)} className="enter text-legible flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t(greetingKey(now.getHours()))}, Raiden</h1>
          <p className="text-sm text-muted-foreground">{t("today.subtitle")}</p>
        </section>

        {(events.error || latest.error) && <ErrorAlert error={events.error ?? latest.error} />}

        <section className="grid gap-3 sm:grid-cols-3">
          <JobSearchCard {...enter(2)} />
          <MailCard {...enter(3)} />
          <InvoicesCard {...enter(4)} latest={latest.data?.find((e) => e.task === "invoices")} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <AttentionCard {...enter(5)} items={attention} />
            <ActivityCard {...enter(7)} events={events.data ?? []} />
          </div>
          <div className="flex flex-col gap-6">
            <AppsCard {...enter(6)} apps={apps.data ?? []} />
            <TasksCard {...enter(8)} latest={latest.data ?? []} />
          </div>
        </div>
      </div>
    </>
  )
}
