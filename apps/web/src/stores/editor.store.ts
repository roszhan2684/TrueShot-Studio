import { create } from 'zustand'
import type { EditJob, EditParameters, EditType, GeneratedHeadshot } from '@trueshot/types'

interface EditorHistoryEntry {
  editType: EditType
  parameters: EditParameters
  resultKey: string
  timestamp: number
}

interface EditorStore {
  activeHeadshot: GeneratedHeadshot | null
  activeEditJob: EditJob | null
  pendingParameters: EditParameters
  editType: EditType | null
  history: EditorHistoryEntry[]
  isSidebarOpen: boolean
  previewScale: number

  setActiveHeadshot: (headshot: GeneratedHeadshot | null) => void
  setEditType: (type: EditType | null) => void
  setPendingParameters: (patch: Partial<EditParameters>) => void
  setActiveEditJob: (job: EditJob | null) => void
  pushHistory: (entry: EditorHistoryEntry) => void
  resetParameters: () => void
  toggleSidebar: () => void
  setPreviewScale: (scale: number) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  activeHeadshot: null,
  activeEditJob: null,
  pendingParameters: {},
  editType: null,
  history: [],
  isSidebarOpen: true,
  previewScale: 1,

  setActiveHeadshot: (headshot) => set({ activeHeadshot: headshot, activeEditJob: null, editType: null, pendingParameters: {} }),
  setEditType: (type) => set({ editType: type, pendingParameters: {} }),
  setPendingParameters: (patch) => set((s) => ({ pendingParameters: { ...s.pendingParameters, ...patch } })),
  setActiveEditJob: (job) => set({ activeEditJob: job }),
  pushHistory: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, 20) })),
  resetParameters: () => set({ pendingParameters: {}, editType: null }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setPreviewScale: (scale) => set({ previewScale: scale }),
}))
