import { useMemo } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ActivityIcon, AppWindowIcon, BellRingIcon, LogOutIcon } from "lucide-react"
import { ErrorAlert } from "@/components/ErrorAlert"
import { PageLoader } from "@/components/PageLoader"
import { Button } from "@/components/ui/button"
import { AppsCard, appsApi } from "@/features/apps"
import { authApi } from "@/features/auth"
import { ActivityCard, AttentionCard, TasksCard, attentionItems, eventsApi, isStale } from "@/features/events"
import { WallpaperBackdrop, WallpaperMenu, useWallpaper } from "@/features/wallpaper"
import { enter } from "@/lib/enter"
import { greeting } from "../utils/greeting"
import { StatTile } from "./StatTile"

const REFRESH_MS = 60_000

export function TodayPage() {
  const events = useQuery({ queryKey: ["events"], queryFn: () => eventsApi.list(), refetchInterval: REFRESH_MS })
  const latest = useQuery({ queryKey: ["events", "latest"], queryFn: eventsApi.latest, refetchInterval: REFRESH_MS })
  const apps = useQuery({ queryKey: ["apps"], queryFn: appsApi.list, refetchInterval: REFRESH_MS })
  const wallpaper = useWallpaper()
  const logout = useMutation({ mutationFn: authApi.logout, onSuccess: () => window.location.assign("/login") })

  const attention = useMemo(() => attentionItems(events.data ?? []), [events.data])

  if (events.isPending || latest.isPending || wallpaper.info.isPending) return <PageLoader />

  const now = new Date()
  const healthyTasks = (latest.data ?? []).filter((e) => e.status !== "error" && !isStale(e.task, e.run_at)).length
  const appsUp = (apps.data ?? []).filter((a) => a.up).length
  const critical = attention.filter((i) => i.severity === "critical").length

  return (
    <>
      {wallpaper.version && <WallpaperBackdrop version={wallpaper.version} />}
      <div data-wallpaper={wallpaper.version ? "" : undefined} className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-4 sm:p-8">
        <header {...enter(0)} className="enter flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="size-8" />
            <span className="font-semibold tracking-tight">Pulse</span>
          </div>
          <div className="flex items-center gap-1">
            <WallpaperMenu />
            <Button variant="ghost" size="icon" onClick={() => logout.mutate()} aria-label="Выйти">
              <LogOutIcon />
            </Button>
          </div>
        </header>

        <section {...enter(1)} className="enter flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{greeting(now.getHours())}, Raiden</h1>
          <p className="text-muted-foreground">Вот что произошло, пока тебя не было.</p>
        </section>

        {(events.error || latest.error) && <ErrorAlert error={events.error ?? latest.error} />}

        <section className="grid grid-cols-3 gap-3">
          <StatTile
            {...enter(2)}
            icon={BellRingIcon}
            value={String(attention.length)}
            label={critical ? `требуют внимания · ${critical} критичных` : "требуют внимания"}
            tone={critical ? "text-destructive" : attention.length ? "text-warning" : "text-success"}
          />
          <StatTile {...enter(3)} icon={ActivityIcon} value={`${healthyTasks}/${latest.data?.length ?? 0}`} label="агентов в норме" tone="text-hue-purple" />
          <StatTile {...enter(4)} icon={AppWindowIcon} value={apps.data ? `${appsUp}/${apps.data.length}` : "—"} label="приложений онлайн" tone="text-hue-blue" />
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
