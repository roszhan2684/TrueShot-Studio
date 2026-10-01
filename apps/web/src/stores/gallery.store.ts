import { create } from 'zustand'
import type { GeneratedHeadshot } from '@trueshot/types'

type GalleryFilter = 'all' | 'favorites' | string  // string for style pack id

interface GalleryStore {
  selectedIds: Set<string>
  compareIds: [string | null, string | null]
  isCompareMode: boolean
  filter: GalleryFilter
  sortBy: 'rank' | 'score' | 'created'

  toggleSelect: (id: string) => void
  clearSelection: () => void
  setCompareIds: (a: string | null, b: string | null) => void
  toggleCompareMode: () => void
  setFilter: (filter: GalleryFilter) => void
  setSortBy: (sort: GalleryStore['sortBy']) => void
}

export const useGalleryStore = create<GalleryStore>((set) => ({
  selectedIds: new Set(),
  compareIds: [null, null],
  isCompareMode: false,
  filter: 'all',
  sortBy: 'rank',

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedIds: next }
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  setCompareIds: (a, b) => set({ compareIds: [a, b] }),

  toggleCompareMode: () =>
    set((s) => ({ isCompareMode: !s.isCompareMode, compareIds: [null, null] })),

  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),
}))
