'use client'

import { Heart, ImageIcon, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHeadshotUrl } from '@/hooks/use-headshot-url'
import { useFavoriteHeadshot } from '@/hooks/use-headshots'
import type { GeneratedHeadshot } from '@trueshot/types'

interface HeadshotCardProps {
  headshot: GeneratedHeadshot
  isSelected: boolean
  isCompareMode: boolean
  onSelect: (id: string) => void
  onOpen: (id: string) => void
}

export function HeadshotCard({
  headshot,
  isSelected,
  isCompareMode,
  onSelect,
  onOpen,
}: HeadshotCardProps) {
  const { data: imageUrl, isLoading: imgLoading } = useHeadshotUrl(headshot.thumbnailKey)
  const { mutate: toggleFavorite } = useFavoriteHeadshot()
  const score = Math.round((headshot.overallScore ?? 0) * 100)

  function handleClick() {
    if (isCompareMode) {
      onSelect(headshot.id)
    } else {
      onOpen(headshot.id)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-muted cursor-pointer',
        'transition-shadow hover:shadow-md',
        isSelected && 'ring-2 ring-brand-700',
      )}
      style={{ aspectRatio: '3 / 4' }}
      onClick={handleClick}
    >
      {/* Image */}
      {imgLoading ? (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      ) : imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt="Generated headshot"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      )}

      {/* Rank badge */}
      {headshot.rank <= 3 && headshot.rank > 0 && (
        <div className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900">
          #{headshot.rank}
        </div>
      )}

      {/* Compare mode selection overlay */}
      {isCompareMode && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center transition-opacity',
            isSelected ? 'bg-brand-700/30' : 'bg-black/0 group-hover:bg-black/10',
          )}
        >
          {isSelected && (
            <div className="rounded-full bg-brand-700 p-1.5">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      )}

      {/* Hover overlay */}
      {!isCompareMode && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      {/* Score + favorite — shown on hover */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full p-2.5 transition-transform group-hover:translate-y-0">
        <div className="flex items-center justify-between">
          <ScorePill score={score} />
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleFavorite({ id: headshot.id, isFavorited: !headshot.isFavorited })
            }}
            className={cn(
              'rounded-full p-1.5 transition-colors',
              headshot.isFavorited
                ? 'bg-red-500 text-white'
                : 'bg-black/40 text-white hover:bg-red-500',
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', headshot.isFavorited && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* Persistent favorite indicator */}
      {headshot.isFavorited && (
        <div className="absolute right-2 top-2 rounded-full bg-red-500 p-1">
          <Heart className="h-3 w-3 fill-current text-white" />
        </div>
      )}
    </motion.div>
  )
}

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400 text-amber-900' : 'bg-muted/80'
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold text-white', color)}>
      {score}
    </span>
  )
}
