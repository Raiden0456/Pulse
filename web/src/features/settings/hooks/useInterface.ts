import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getLocale, isLocale, setLocale, type Locale } from "@/i18n"
import { settingsApi } from "../api"
import type { InterfaceSettings } from "../types/interface"

const key = ["interface"]
const DEFAULT_DIM = 55

export function useInterface() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: key, queryFn: settingsApi.interface, staleTime: Infinity })
  const save = useMutation({
    mutationFn: settingsApi.saveInterface,
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  })

  const current = (): InterfaceSettings =>
    queryClient.getQueryData<InterfaceSettings>(key) ?? { language: getLocale(), wallpaper_dim: DEFAULT_DIM }

  return {
    query,
    dim: query.data?.wallpaper_dim ?? DEFAULT_DIM,
    setLanguage: (language: Locale) => {
      setLocale(language)
      save.mutate({ ...current(), language })
    },
    previewDim: (wallpaper_dim: number) => queryClient.setQueryData(key, { ...current(), wallpaper_dim }),
    commitDim: () => save.mutate(current()),
  }
}

export function useInterfaceSync() {
  const { query } = useInterface()
  const { mutate } = useMutation({ mutationFn: settingsApi.saveInterface })

  useEffect(() => {
    if (!query.data) return
    if (isLocale(query.data.language)) setLocale(query.data.language)
    else mutate({ ...query.data, language: getLocale() })
  }, [query.data, mutate])
}
