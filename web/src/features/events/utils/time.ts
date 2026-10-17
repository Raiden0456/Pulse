import { getLocale, t } from "@/i18n"

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ["minute", 60],
  ["hour", 60],
  ["day", 24],
  ["week", 7],
]

export function relativeTime(unixSeconds: number, now = Date.now()) {
  let value = (unixSeconds * 1000 - now) / 1000
  if (Math.abs(value) < 60) return t("common.justNow")
  let unit: Intl.RelativeTimeFormatUnit = "second"
  for (const [next, size] of steps) {
    if (Math.abs(value) < size) break
    value /= size
    unit = next
  }
  return new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" }).format(Math.round(value), unit)
}

export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(getLocale(), { day: "numeric", month: "short" })
}
