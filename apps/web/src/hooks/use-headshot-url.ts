'use client'

import { useQuery } from '@tanstack/react-query'
import { headshotsApi } from '@/lib/api'

export function useHeadshotUrl(storageKey: string | null | undefined) {
  return useQuery({
    queryKey: ['headshot-url', storageKey],
    queryFn: () => headshotsApi.getImageUrl(storageKey!),
    enabled: !!storageKey,
    staleTime: 50 * 60 * 1000,  // presigned URLs are valid 1h; refetch at 50m
    gcTime: 60 * 60 * 1000,
  })
}
