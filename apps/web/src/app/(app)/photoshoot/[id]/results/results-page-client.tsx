'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useHeadshots } from '@/hooks/use-headshots'
import { usePhotoshoot } from '@/hooks/use-photoshoot'
import { useGalleryStore } from '@/stores/gallery.store'
import { HeadshotCard } from '@/components/gallery/headshot-card'
import { GalleryToolbar } from '@/components/gallery/gallery-toolbar'
import { ComparePanel } from '@/components/gallery/compare-panel'
import type { GeneratedHeadshot } from '@trueshot/types'

interface Props {
  photoshootId: string
}

export function ResultsPageClient({ photoshootId }: Props) {
  const router = useRouter()
  const { data: job, isLoading: jobLoading } = usePhotoshoot(photoshootId)
  const { data: headshotsData, isLoading: hsLoading } = useHeadshots(photoshootId)
  const { filter, sortBy, selectedIds, isCompareMode, compareIds, toggleSelect, setCompareIds } =
    useGalleryStore()
  const [openedId, setOpenedId] = useState<string | null>(null)

  const allHeadshots: GeneratedHeadshot[] = headshotsData?.items ?? []

  // Filter
  const filtered = allHeadshots.filter((h) => {
    if (h.isRejected) return false
    if (filter === 'favorites') return h.isFavorited
    if (filter !== 'all') return h.stylePackId === filter
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rank') return (a.rank ?? 999) - (b.rank ?? 999)
    if (sortBy === 'score') return (b.overallScore ?? 0) - (a.overallScore ?? 0)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  function handleCardSelect(id: string) {
    // In compare mode, fill [a, b] slots
    const [a, b] = compareIds
    if (!a) return setCompareIds(id, b)
    if (!b) return setCompareIds(a, id)
    setCompareIds(id, b) // replace A when both slots full
  }

  function handleDownloadSelected() {
    toast.info('Export selected — coming in STEP 9')
  }

  if (jobLoading || hsLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">
              {job?.title ?? `Photoshoot — ${photoshootId.slice(-6)}`}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {job?.qualityPassCount ?? allHeadshots.length} headshots •{' '}
              {allHeadshots.filter((h) => h.isFavorited).length} favorited
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/photoshoot/${photoshootId}/exports`)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => router.push(`/photoshoot/${photoshootId}/editor`)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              <Sparkles className="h-4 w-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-border bg-background px-6 py-3">
        <GalleryToolbar
          totalCount={allHeadshots.length}
          selectedCount={selectedIds.size}
          onDownloadSelected={handleDownloadSelected}
        />
      </div>

      {/* Gallery grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {sorted.length === 0 ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-medium">No headshots here</p>
            <p className="text-sm text-muted-foreground">
              {filter !== 'all' ? 'Try a different filter' : 'Nothing generated yet'}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((headshot) => (
                <HeadshotCard
                  key={headshot.id}
                  headshot={headshot}
                  isSelected={
                    isCompareMode
                      ? compareIds[0] === headshot.id || compareIds[1] === headshot.id
                      : selectedIds.has(headshot.id)
                  }
                  isCompareMode={isCompareMode}
                  onSelect={handleCardSelect}
                  onOpen={setOpenedId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Compare panel (slides up from bottom) */}
      <AnimatePresence>
        {isCompareMode && (compareIds[0] || compareIds[1]) && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <ComparePanel headshots={allHeadshots} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
