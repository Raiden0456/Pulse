import { useRef } from "react"
import { ImageIcon, ImageOffIcon, ImageUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useInterface } from "@/features/settings"
import { useI18n } from "@/i18n"
import { useWallpaper } from "../hooks/useWallpaper"

export function WallpaperMenu() {
  const { t } = useI18n()
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
          <Button variant="ghost" size="icon" aria-label={t("wallpaper.label")} disabled={upload.isPending}>
            <ImageIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center justify-between">
                {t("wallpaper.dim")}
                <span className="tabular-nums text-muted-foreground">{dim}%</span>
              </DropdownMenuLabel>
              <div className="px-2 pb-2">
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
