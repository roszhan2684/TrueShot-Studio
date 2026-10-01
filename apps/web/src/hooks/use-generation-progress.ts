'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { photoshootsApi } from '@/lib/api'

const TERMINAL = new Set(['completed', 'failed', 'cancelled'])

export interface GenerationProgress {
  jobId: string
  status: string
  totalOutputs: number
  completedOutputs: number
  currentStep: string
  currentStyle: string
  recentHeadshotIds: string[]
  qualityPassCount: number
  completedAt: string | null
  errorMessage: string | null
}

export function useGenerationProgress(photoshootId: string, enabled = true) {
  const query = useQuery<GenerationProgress>({
    queryKey: ['generation-progress', photoshootId],
    queryFn: async () => {
      const res = await photoshootsApi.getGenerationProgress(photoshootId)
      return res.data.data
    },
    enabled,
    refetchInterval: (data) => {
      if (!data || TERMINAL.has(data.status)) return false
      return 2500
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  })

  return query
}
