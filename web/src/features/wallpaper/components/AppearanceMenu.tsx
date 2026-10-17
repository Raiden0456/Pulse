import { useRef } from "react"
import { ImageOffIcon, ImageUpIcon, MonitorIcon, MoonIcon, PaletteIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useInterface } from "@/features/settings"
import { useI18n, type MessageKey } from "@/i18n"
import { useWallpaper } from "../hooks/useWallpaper"

const themes: { value: string; label: MessageKey; icon: typeof SunIcon }[] = [
  { value: "light", label: "appearance.light", icon: SunIcon },
  { value: "dark", label: "appearance.dark", icon: MoonIcon },
  { value: "system", label: "appearance.system", icon: MonitorIcon },
]

export function AppearanceMenu() {
  const { t } = useI18n()
  const { theme, setTheme } = useTheme()
  const input = useRef<HTMLInputElement>(null)
  const { version, upload, remove } = useWallpaper()
  const { dim, previewDim, commitDim } = useInterface()

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload.mutate(file)
          e.target.value = ""
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("appearance.label")} disabled={upload.isPending}>
            <PaletteIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel>{t("appearance.theme")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            {themes.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {t(label)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t("wallpaper.label")}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => input.current?.click()}>
            <ImageUpIcon />
            {version ? t("wallpaper.change") : t("wallpaper.choose")}
          </DropdownMenuItem>
          {version && (
            <>
              <DropdownMenuItem onSelect={() => remove.mutate()}>
                <ImageOffIcon />
                {t("wallpaper.remove")}
              </DropdownMenuItem>
              <div className="flex flex-col gap-1.5 px-2 pt-1 pb-2">
                <span className="flex items-center justify-between text-xs text-muted-foreground">
                  {t("wallpaper.dim")}
                  <span className="tabular-nums">{dim}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={dim}
                  aria-label={t("wallpaper.dim")}
                  className="w-full accent-primary"
                  onChange={(e) => previewDim(Number(e.target.value))}
                  onPointerUp={commitDim}
                  onKeyUp={commitDim}
                  onKeyDown={(e) => e.key !== "Escape" && e.stopPropagation()}
                />
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
