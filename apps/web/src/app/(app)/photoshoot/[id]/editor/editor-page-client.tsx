'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Download,
  History,
  ImageIcon,
  Loader2,
  RotateCcw,
  Wand2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useHeadshots } from '@/hooks/use-headshots'
import { useHeadshotUrl } from '@/hooks/use-headshot-url'
import { useCreateEdit, useEditJobStatus } from '@/hooks/use-editor'
import { useEditorStore } from '@/stores/editor.store'
import { EditTypePanel } from '@/components/editor/edit-type-panel'
import { EditParametersPanel } from '@/components/editor/edit-parameters-panel'
import type { EditType } from '@trueshot/types'

interface Props {
  photoshootId: string
}

export function EditorPageClient({ photoshootId }: Props) {
  const searchParams = useSearchParams()
  const initialHeadshotId = searchParams.get('id')

  const { data: headshotsData, isLoading } = useHeadshots(photoshootId)
  const {
    activeHeadshot,
    activeEditJob,
    editType,
    pendingParameters,
    history,
    isSidebarOpen,
    setActiveHeadshot,
    setEditType,
    resetParameters,
    toggleSidebar,
  } = useEditorStore()

  const { mutate: createEdit, isPending: isSubmitting } = useCreateEdit()
  const { data: editJobStatus } = useEditJobStatus(activeEditJob?.id ?? null)

  const headshots = headshotsData?.items ?? []

  // Pre-select headshot from URL param or first result
  useEffect(() => {
    if (headshots.length === 0) return
    const target = headshots.find((h) => h.id === initialHeadshotId) ?? headshots[0]
    if (!activeHeadshot && target) setActiveHeadshot(target)
  }, [headshots, initialHeadshotId, activeHeadshot, setActiveHeadshot])

  // Show result when edit job completes
  useEffect(() => {
    if (editJobStatus?.status === 'completed') {
      toast.success('Edit applied!')
    }
    if (editJobStatus?.status === 'failed') {
      toast.error('Edit failed. Try again.')
    }
  }, [editJobStatus?.status])

  const resultKey =
    editJobStatus?.status === 'completed' ? editJobStatus.resultStorageKey : null
  const { data: resultUrl } = useHeadshotUrl(resultKey)
  const { data: sourceUrl } = useHeadshotUrl(activeHeadshot?.storageKey)

  const previewUrl = resultUrl ?? sourceUrl
  const isProcessing =
    editJobStatus?.status === 'queued' || editJobStatus?.status === 'processing'

  function handleApply() {
    if (!activeHeadshot || !editType) return
    createEdit({ headshotId: activeHeadshot.id, editType, parameters: pendingParameters })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar — edit type list */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex shrink-0 flex-col overflow-hidden border-r border-border bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <Link
                href={`/photoshoot/${photoshootId}/results`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back to results
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EditTypePanel
                activeType={editType}
                onSelect={(t: EditType) => {
                  setEditType(t)
                }}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Center — preview canvas */}
      <div className="relative flex flex-1 flex-col overflow-hidden bg-muted/20">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-2">
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <Wand2 className="h-4 w-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={resetParameters}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            {resultUrl && (
              <a
                href={resultUrl}
                download
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" /> Save
              </a>
            )}
          </div>
        </div>

        {/* Image preview */}
        <div className="relative flex flex-1 items-center justify-center p-6">
          {previewUrl ? (
            <div className="relative max-h-full max-w-full overflow-hidden rounded-2xl shadow-premium-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Headshot preview"
                className="max-h-[70vh] max-w-full object-contain"
              />
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                  <div className="flex flex-col items-center gap-2 text-white">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-medium">Applying edit…</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <ImageIcon className="h-12 w-12 opacity-30" />
              <p className="text-sm">Select a headshot from the list</p>
            </div>
          )}
        </div>

        {/* Bottom headshot strip */}
        {headshots.length > 1 && (
          <div className="border-t border-border bg-background px-4 py-2">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {headshots.filter((h) => !h.isRejected).map((h) => (
                <HeadshotThumb
                  key={h.id}
                  storageKey={h.thumbnailKey}
                  active={activeHeadshot?.id === h.id}
                  onClick={() => setActiveHeadshot(h)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar — parameters + apply */}
      <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-l border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold">
            {editType ? editType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Settings'}
          </span>
          {history.length > 0 && (
            <button className="text-muted-foreground hover:text-foreground">
              <History className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <EditParametersPanel />
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={handleApply}
            disabled={!editType || isSubmitting || isProcessing}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
              editType && !isSubmitting && !isProcessing
                ? 'bg-brand-900 text-white hover:bg-brand-700'
                : 'cursor-not-allowed bg-muted text-muted-foreground',
            )}
          >
            {isSubmitting || isProcessing ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Applying…</>
            ) : (
              <><Wand2 className="h-4 w-4" /> Apply edit</>
            )}
          </button>
        </div>
      </aside>
    </div>
  )
}

function HeadshotThumb({
  storageKey,
  active,
  onClick,
}: {
  storageKey: string
  active: boolean
  onClick: () => void
}) {
  const { data: url } = useHeadshotUrl(storageKey)
  return (
    <button
      onClick={onClick}
      className={cn(
        'h-14 w-10 shrink-0 overflow-hidden rounded-md border transition-all',
        active ? 'border-brand-700 ring-2 ring-brand-700/30' : 'border-border hover:border-muted-foreground',
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
    </button>
  )
}
