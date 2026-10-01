import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { headshotsApi } from '@/lib/api'

export function useHeadshots(photoshootId: string) {
  return useQuery({
    queryKey: ['headshots', photoshootId],
    queryFn: () => headshotsApi.list(photoshootId),
    enabled: !!photoshootId,
  })
}

export function useFavoriteHeadshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isFavorited }: { id: string; isFavorited: boolean }) =>
      headshotsApi.favorite(id, isFavorited),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['headshots'] })
      queryClient.setQueryData(['headshot', updated.id], updated)
    },
  })
}
