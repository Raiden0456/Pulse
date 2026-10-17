import { useRef } from "react"
import { ImageIcon, ImageOffIcon, ImageUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useWallpaper } from "../hooks/useWallpaper"

export function WallpaperMenu() {
  const input = useRef<HTMLInputElement>(null)
  const { version, upload, remove } = useWallpaper()

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
          <Button variant="ghost" size="icon" aria-label="Фон" disabled={upload.isPending}>
            <ImageIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => input.current?.click()}>
            <ImageUpIcon />
            {version ? "Сменить фон" : "Выбрать фон"}
          </DropdownMenuItem>
          {version && (
            <DropdownMenuItem onSelect={() => remove.mutate()}>
              <ImageOffIcon />
              Убрать фон
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
