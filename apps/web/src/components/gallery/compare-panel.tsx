'use client'

import { X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHeadshotUrl } from '@/hooks/use-headshot-url'
import { useGalleryStore } from '@/stores/gallery.store'
import type { GeneratedHeadshot } from '@trueshot/types'

const SCORE_DIMS = [
  { key: 'identity_similarity', label: 'Identity match' },
  { key: 'face_quality', label: 'Face quality' },
  { key: 'sharpness', label: 'Sharpness' },
  { key: 'natural_eyes', label: 'Natural eyes' },
  { key: 'skin_texture', label: 'Skin texture' },
  { key: 'symmetry', label: 'Symmetry' },
  { key: 'composition', label: 'Composition' },
]

interface ComparePanelProps {
  headshots: GeneratedHeadshot[]
}

export function ComparePanel({ headshots }: ComparePanelProps) {
  const { compareIds, setCompareIds } = useGalleryStore()
  const [aId, bId] = compareIds

  const a = headshots.find((h) => h.id === aId) ?? null
  const b = headshots.find((h) => h.id === bId) ?? null

  if (!aId && !bId) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background shadow-premium-dark">
      <div className="mx-auto max-w-4xl px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Comparing headshots</h3>
          <button
            onClick={() => setCompareIds(null, null)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <CompareSlot headshot={a} label="A" onClear={() => setCompareIds(null, bId)} />
          <CompareSlot headshot={b} label="B" onClear={() => setCompareIds(aId, null)} />
        </div>

        {a && b && (
          <div className="mt-5 space-y-2">
            {SCORE_DIMS.map(({ key, label }) => {
              const aVal = (a.qualityScore as Record<string, number> | null)?.[key] ?? 0
              const bVal = (b.qualityScore as Record<string, number> | null)?.[key] ?? 0
              return (
                <ScoreRow key={key} label={label} aVal={aVal} bVal={bVal} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function CompareSlot({
  headshot,
  label,
  onClear,
}: {
  headshot: GeneratedHeadshot | null
  label: string
  onClear: () => void
}) {
  const { data: url } = useHeadshotUrl(headshot?.thumbnailKey)

  return (
    <div className="flex gap-3">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Compare headshot" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute left-1 top-1 rounded bg-black/60 px-1 text-[10px] font-bold text-white">
          {label}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {headshot ? (
          <>
            <p className="truncate text-xs font-medium">
              {headshot.stylePackId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {Math.round((headshot.overallScore ?? 0) * 100)}
              <span className="text-sm font-normal text-muted-foreground"> / 100</span>
            </p>
            <button onClick={onClear} className="mt-1 text-xs text-muted-foreground hover:text-destructive">
              Remove
            </button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Select a headshot to compare</p>
        )}
      </div>
    </div>
  )
}

function ScoreRow({ label, aVal, bVal }: { label: string; aVal: number; bVal: number }) {
  const aWins = aVal >= bVal
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
      <div className="flex items-center justify-end gap-1.5">
        <span
          className={cn(
            'tabular-nums font-semibold',
            aWins ? 'text-green-600' : 'text-muted-foreground',
          )}
        >
          {Math.round(aVal * 100)}
        </span>
        <ScoreBar value={aVal} flipped winner={aWins} />
      </div>
      <span className="text-center text-[10px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <ScoreBar value={bVal} winner={!aWins} />
        <span
          className={cn(
            'tabular-nums font-semibold',
            !aWins ? 'text-green-600' : 'text-muted-foreground',
          )}
        >
          {Math.round(bVal * 100)}
        </span>
      </div>
    </div>
  )
}

function ScoreBar({ value, flipped, winner }: { value: number; flipped?: boolean; winner: boolean }) {
  const w = `${Math.round(value * 100)}%`
  return (
    <div className={cn('h-1.5 w-24 overflow-hidden rounded-full bg-muted', flipped && 'direction-rtl')}>
      <div
        className={cn('h-full rounded-full transition-all', winner ? 'bg-green-500' : 'bg-muted-foreground/40')}
        style={{ width: w, marginLeft: flipped ? 'auto' : 0 }}
      />
    </div>
  )
}
