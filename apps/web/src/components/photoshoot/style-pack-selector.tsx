'use client'

import { motion } from 'framer-motion'
import { Check, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePhotoshootStore } from '@/stores/photoshoot.store'
import { STYLE_PACKS } from '@trueshot/types'
import type { StylePack } from '@trueshot/types'

function StylePackCard({ pack, selected, onToggle }: { pack: StylePack; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      onClick={onToggle}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all',
        selected
          ? 'border-brand-900/40 bg-brand-950 text-white shadow-premium-dark'
          : 'border-border bg-background hover:border-foreground/20 hover:shadow-sm'
      )}
    >
      {/* Selected checkmark */}
      {selected && (
        <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      {/* Preview placeholder */}
      <div
        className={cn(
          'aspect-[4/3] w-full overflow-hidden rounded-xl',
          selected ? 'bg-white/10' : 'bg-muted'
        )}
      >
        <div className="flex h-full items-center justify-center">
          <div
            className={cn(
              'h-16 w-12 rounded-lg',
              selected ? 'bg-white/20' : 'bg-border'
            )}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className={cn('text-sm font-semibold', selected ? 'text-white' : 'text-foreground')}>
            {pack.name}
          </p>
          {pack.isPremium && (
            <span
              className={cn(
                'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                selected ? 'bg-white/20 text-white/80' : 'bg-amber-100 text-amber-700'
              )}
            >
              <Lock className="h-2.5 w-2.5" />
              Pro
            </span>
          )}
        </div>
        <p className={cn('mt-1 text-xs leading-relaxed', selected ? 'text-white/60' : 'text-muted-foreground')}>
          {pack.description}
        </p>
        <p className={cn('mt-2 text-xs font-medium', selected ? 'text-white/50' : 'text-muted-foreground/60')}>
          {pack.outputCount} outputs
        </p>
      </div>
    </motion.button>
  )
}

export function StylePackSelector() {
  const { selectedStylePacks, toggleStylePack } = usePhotoshootStore()

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-base font-semibold">Choose your style packs</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Select 1–6 styles. Each generates multiple headshots.{' '}
          <span className="font-medium text-foreground">
            {selectedStylePacks.length} selected.
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STYLE_PACKS.map((pack) => (
          <StylePackCard
            key={pack.id}
            pack={pack}
            selected={selectedStylePacks.some((p) => p.id === pack.id)}
            onToggle={() => toggleStylePack(pack)}
          />
        ))}
      </div>

      {selectedStylePacks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-xl border border-border bg-muted/30 p-4"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Estimated outputs:{' '}
            <span className="font-semibold text-foreground">
              {selectedStylePacks.reduce((sum, p) => sum + p.outputCount, 0)} headshots
            </span>{' '}
            across {selectedStylePacks.length} style{selectedStylePacks.length !== 1 ? 's' : ''}
          </p>
        </motion.div>
      )}
    </div>
  )
}
