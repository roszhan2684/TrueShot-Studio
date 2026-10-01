'use client'

import { Columns2, Heart, LayoutGrid, SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGalleryStore } from '@/stores/gallery.store'
import { STYLE_PACKS } from '@trueshot/types'

interface GalleryToolbarProps {
  totalCount: number
  selectedCount: number
  onDownloadSelected: () => void
}

export function GalleryToolbar({ totalCount, selectedCount, onDownloadSelected }: GalleryToolbarProps) {
  const { filter, sortBy, isCompareMode, setFilter, setSortBy, toggleCompareMode, clearSelection } =
    useGalleryStore()

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <FilterChip label="All" value="all" active={filter === 'all'} onClick={setFilter} />
        <FilterChip
          label={<><Heart className="h-3 w-3" /> Favorites</>}
          value="favorites"
          active={filter === 'favorites'}
          onClick={setFilter}
        />
        {STYLE_PACKS.map((pack) => (
          <FilterChip
            key={pack.id}
            label={pack.name}
            value={pack.id}
            active={filter === pack.id}
            onClick={setFilter}
          />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Sort */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'rank' | 'score' | 'created')}
            className="bg-transparent text-xs font-medium focus:outline-none"
          >
            <option value="rank">Best first</option>
            <option value="score">By score</option>
            <option value="created">Newest</option>
          </select>
        </div>

        {/* Compare mode toggle */}
        <button
          onClick={toggleCompareMode}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
            isCompareMode
              ? 'border-brand-700 bg-brand-700/10 text-brand-700'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          <Columns2 className="h-3.5 w-3.5" />
          Compare
        </button>
      </div>

      {/* Bulk action bar — visible when items selected in compare mode */}
      {isCompareMode && selectedCount > 0 && (
        <div className="flex w-full items-center gap-3 rounded-lg bg-brand-700/10 px-4 py-2">
          <span className="text-xs font-medium text-brand-700">
            {selectedCount} selected
          </span>
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
          {selectedCount >= 2 && (
            <button
              onClick={onDownloadSelected}
              className="rounded-md bg-brand-900 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              Download selected
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  value,
  active,
  onClick,
}: {
  label: React.ReactNode
  value: string
  active: boolean
  onClick: (v: string) => void
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'flex items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-brand-700 bg-brand-700/10 text-brand-700'
          : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
