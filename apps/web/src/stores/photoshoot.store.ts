import { create } from 'zustand'
import type { PhotoshootJob, StylePack, UploadedReferenceImage } from '@trueshot/types'

interface UploadItem {
  id: string                    // local temp id
  file: File
  storageKey?: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  errorMessage?: string
  qualityScore?: number
}

interface PhotoshootStore {
  // New shoot wizard
  selectedStylePacks: StylePack[]
  uploadItems: UploadItem[]
  activeJob: PhotoshootJob | null
  generationProgress: number
  generationStep: string | null

  // Actions
  toggleStylePack: (pack: StylePack) => void
  addUploadItems: (files: File[]) => void
  updateUploadItem: (id: string, patch: Partial<UploadItem>) => void
  removeUploadItem: (id: string) => void
  setActiveJob: (job: PhotoshootJob | null) => void
  setGenerationProgress: (progress: number, step?: string) => void
  resetWizard: () => void
}

export const usePhotoshootStore = create<PhotoshootStore>((set) => ({
  selectedStylePacks: [],
  uploadItems: [],
  activeJob: null,
  generationProgress: 0,
  generationStep: null,

  toggleStylePack: (pack) =>
    set((s) => ({
      selectedStylePacks: s.selectedStylePacks.find((p) => p.id === pack.id)
        ? s.selectedStylePacks.filter((p) => p.id !== pack.id)
        : [...s.selectedStylePacks, pack],
    })),

  addUploadItems: (files) =>
    set((s) => ({
      uploadItems: [
        ...s.uploadItems,
        ...files.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          status: 'pending' as const,
          progress: 0,
        })),
      ],
    })),

  updateUploadItem: (id, patch) =>
    set((s) => ({
      uploadItems: s.uploadItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    })),

  removeUploadItem: (id) =>
    set((s) => ({ uploadItems: s.uploadItems.filter((item) => item.id !== id) })),

  setActiveJob: (job) => set({ activeJob: job }),

  setGenerationProgress: (progress, step) =>
    set({ generationProgress: progress, generationStep: step ?? null }),

  resetWizard: () =>
    set({
      selectedStylePacks: [],
      uploadItems: [],
      activeJob: null,
      generationProgress: 0,
      generationStep: null,
    }),
}))
