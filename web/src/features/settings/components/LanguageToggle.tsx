import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n"
import { useInterface } from "../hooks/useInterface"

export function LanguageToggle() {
  const { locale, t } = useI18n()
  const { setLanguage } = useInterface()
  const next = locale === "ru" ? "en" : "ru"

  return (
    <Button variant="ghost" size="icon" onClick={() => setLanguage(next)} aria-label={t("common.switchLanguage")} className="text-xs font-semibold uppercase">
      {next}
    </Button>
  )
}
