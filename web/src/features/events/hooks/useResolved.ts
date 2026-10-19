import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { eventsApi } from "../api"
import type { ResolvedItem } from "../types/resolved"

const key = ["attention", "resolved"]

export function useResolved() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: key, queryFn: eventsApi.resolved, staleTime: 60_000 })

  const optimistic = (apply: (items: ResolvedItem[]) => ResolvedItem[]) => {
    queryClient.setQueryData<ResolvedItem[]>(key, (items = []) => apply(items))
  }

  const resolve = useMutation({
    mutationFn: async (keys: string[]) => {
      await Promise.all(keys.map(eventsApi.resolve))
    },
    onMutate: (keys) => {
      const now = Math.floor(Date.now() / 1000)
      optimistic((items) => [...keys.map((k) => ({ key: k, resolved_at: now })), ...items.filter((i) => !keys.includes(i.key))])
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const unresolve = useMutation({
    mutationFn: eventsApi.unresolve,
    onMutate: (k) => optimistic((items) => items.filter((i) => i.key !== k)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  return {
    resolvedKeys: new Set((query.data ?? []).map((i) => i.key)),
    resolve: (keys: string[]) => resolve.mutate(keys),
    unresolve: (k: string) => unresolve.mutate(k),
  }
}
