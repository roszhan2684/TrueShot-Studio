import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { photoshootsApi } from '@/lib/api'
import { POLLING_INTERVAL_MS } from '@/lib/constants'
import type { PhotoshootStatus } from '@trueshot/types'

const TERMINAL_STATUSES: PhotoshootStatus[] = ['completed', 'failed', 'cancelled']

export function usePhotoshoots() {
  return useQuery({
    queryKey: ['photoshoots'],
    queryFn: () => photoshootsApi.list(),
  })
}

export function usePhotoshoot(id: string) {
  return useQuery({
    queryKey: ['photoshoot', id],
    queryFn: () => photoshootsApi.get(id),
    enabled: !!id,
  })
}

export function usePhotoshootStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: ['photoshoot-status', id],
    queryFn: () => photoshootsApi.getStatus(id),
    enabled: enabled && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status) return POLLING_INTERVAL_MS
      return TERMINAL_STATUSES.includes(status as PhotoshootStatus) ? false : POLLING_INTERVAL_MS
    },
  })
}

export function useCreatePhotoshoot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ stylePackIds, title }: { stylePackIds: string[]; title?: string }) =>
      photoshootsApi.create(stylePackIds, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photoshoots'] })
    },
  })
}
