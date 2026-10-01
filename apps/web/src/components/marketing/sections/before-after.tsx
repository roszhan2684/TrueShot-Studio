'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimateIn } from '../animate-in'

const EXAMPLES = [
  {
    id: 'linkedin',
    style: 'LinkedIn Modern',
    score: '98%',
    description: 'Neutral background, professional framing, optimized for profile photos.',
    beforeBg: 'from-zinc-200 to-zinc-300',
    afterBg: 'from-slate-700 to-slate-900',
    afterAccent: 'bg-slate-600/50',
  },
  {
    id: 'executive',
    style: 'Executive Dark',
    score: '96%',
    description: 'Dark high-contrast studio background for senior executive positioning.',
    beforeBg: 'from-zinc-200 to-zinc-300',
    afterBg: 'from-zinc-900 to-black',
    afterAccent: 'bg-zinc-800/60',
  },
  {
    id: 'founder',
    style: 'Founder / Startup',
    score: '97%',
    description: 'Casual-confident look for startup profiles, boards, and press kits.',
    beforeBg: 'from-zinc-200 to-zinc-300',
    afterBg: 'from-stone-600 to-stone-800',
    afterAccent: 'bg-stone-700/60',
  },
  {
    id: 'creative',
    style: 'Creative Professional',
    score: '95%',
    description: 'Warm textured backgrounds for designers, writers, and creators.',
    beforeBg: 'from-zinc-200 to-zinc-300',
    afterBg: 'from-amber-900/80 to-stone-900',
    afterAccent: 'bg-amber-900/40',
  },
]

function PortraitCard({
  type,
  bg,
  accent,
  score,
}: {
  type: 'before' | 'after'
  bg: string
  accent?: string
  score?: string
}) {
  return (
    <div className={cn('relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-gradient-to-br', bg)}>
      {/* Body silhouette */}
      <div className={cn('absolute bottom-0 inset-x-0 h-2/3 rounded-t-3xl opacity-60', accent ?? 'bg-zinc-300/50')} />
      {/* Head */}
      <div className="absolute inset-x-0 top-[18%] flex justify-center">
        <div className={cn('h-[30%] w-[45%] rounded-full', type === 'before' ? 'bg-zinc-400/70' : 'bg-zinc-500/60')} style={{ aspectRatio: '1' }} />
      </div>

      {type === 'after' && score && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
          <span className="text-[10px] font-semibold text-white">{score} identity match</span>
        </div>
      )}
      {type === 'before' && (
        <div className="absolute left-3 top-3 rounded-full bg-black/20 px-2.5 py-1 backdrop-blur-sm">
          <span className="text-[10px] font-medium text-white/80">Your photo</span>
        </div>
      )}
    </div>
  )
}

export function BeforeAfterSection() {
  const [active, setActive] = useState(0)
  const example = EXAMPLES[active]

  return (
    <section className="border-t border-border bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Results
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Six professional styles. One consistent identity.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Every output is scored for identity accuracy before you see it. Low-quality results
            are automatically filtered out.
          </p>
        </AnimateIn>

        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          {/* Style selector */}
          <AnimateIn direction="right" className="flex flex-col gap-2">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.id}
                onClick={() => setActive(i)}
                className={cn(
                  'group flex flex-col items-start gap-1 rounded-xl border px-5 py-4 text-left transition-all',
                  active === i
                    ? 'border-foreground/20 bg-background shadow-sm'
                    : 'border-transparent hover:border-border hover:bg-background/60'
                )}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={cn('text-sm font-semibold', active === i ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
                    {ex.style}
                  </span>
                  {active === i && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      {ex.score}
                    </span>
                  )}
                </div>
                {active === i && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{ex.description}</p>
                )}
              </button>
            ))}
          </AnimateIn>

          {/* Before / After display */}
          <AnimateIn delay={0.1}>
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="grid grid-cols-2 gap-4 sm:gap-6"
            >
              <div className="flex flex-col gap-3">
                <PortraitCard type="before" bg={example.beforeBg} />
              </div>
              <div className="flex flex-col gap-3">
                <PortraitCard
                  type="after"
                  bg={example.afterBg}
                  accent={example.afterAccent}
                  score={example.score}
                />
              </div>
            </motion.div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { label: 'Identity similarity', value: example.score, color: 'bg-green-500' },
                { label: 'Face quality', value: '94%', color: 'bg-blue-500' },
                { label: 'Sharpness', value: '99%', color: 'bg-violet-500' },
                { label: 'Natural eyes', value: '96%', color: 'bg-amber-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-xs font-semibold">{value}</span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      key={`${example.id}-${label}`}
                      className={cn('h-full rounded-full', color)}
                      initial={{ width: 0 }}
                      animate={{ width: value }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
