'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const AVATARS = [
  { initials: 'JL', color: 'bg-stone-700' },
  { initials: 'SK', color: 'bg-zinc-600' },
  { initials: 'MT', color: 'bg-neutral-700' },
  { initials: 'AR', color: 'bg-stone-600' },
]

function SocialProofAvatars() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {AVATARS.map((a) => (
          <div
            key={a.initials}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white',
              a.color
            )}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">2,400+</span> professionals trusted us this month
      </p>
    </div>
  )
}

function BeforeAfterChip() {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1">
      <Sparkles className="h-3 w-3 text-amber-500" />
      <span className="text-xs font-medium">Identity-faithful generation</span>
    </div>
  )
}

function HeroImage({ label, type }: { label: string; type: 'before' | 'after' }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative h-72 w-56 overflow-hidden rounded-2xl',
          type === 'before'
            ? 'bg-gradient-to-br from-zinc-200 to-zinc-300'
            : 'bg-gradient-to-br from-zinc-800 to-zinc-900'
        )}
      >
        {/* Simulated portrait placeholder */}
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <div
            className={cn(
              'h-48 w-44 rounded-xl',
              type === 'before'
                ? 'bg-gradient-to-b from-zinc-300/60 to-zinc-400/80'
                : 'bg-gradient-to-b from-zinc-700/60 to-zinc-800/80'
            )}
          />
        </div>
        {/* Avatar circle */}
        <div className="absolute inset-x-0 top-8 flex justify-center">
          <div
            className={cn(
              'h-24 w-24 rounded-full',
              type === 'before' ? 'bg-zinc-400/70' : 'bg-zinc-600/70'
            )}
          />
        </div>
        {type === 'after' && (
          <div className="absolute right-3 top-3 rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-semibold text-green-400 ring-1 ring-green-500/30">
            97% match
          </div>
        )}
      </div>
      <span
        className={cn(
          'rounded-full px-3 py-0.5 text-xs font-medium',
          type === 'before'
            ? 'bg-muted text-muted-foreground'
            : 'bg-brand-900 text-white'
        )}
      >
        {label}
      </span>
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pb-24 pt-20 md:pt-28">
      {/* Subtle background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left — copy */}
          <div className="flex flex-col items-start gap-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <BeforeAfterChip />
            </motion.div>

            <motion.h1
              className="text-5xl font-semibold leading-[1.08] tracking-tighter text-foreground lg:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              Headshots that look like{' '}
              <span className="relative">
                <span className="relative z-10">you</span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-3 rounded-sm bg-amber-200/60"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: 'easeOut' }}
                  style={{ originX: 0 }}
                />
              </span>
              {', '}not an AI version of you.
            </motion.h1>

            <motion.p
              className="max-w-lg text-lg leading-relaxed text-muted-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              Upload 8–15 reference photos. TrueShot builds an identity profile from your face,
              generates studio-quality headshots across professional styles, scores every output
              for identity accuracy, and surfaces only the best.
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href="/sign-up"
                className="group flex items-center gap-2 rounded-lg bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:shadow-lg"
              >
                Get your headshots
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/examples"
                className="rounded-lg border border-border px-5 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                See examples
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <SocialProofAvatars />
            </motion.div>
          </div>

          {/* Right — before/after visual */}
          <motion.div
            className="relative flex items-center justify-center gap-6"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-radial from-brand-100/60 via-transparent to-transparent blur-3xl" />

            <HeroImage label="Your photo" type="before" />

            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
                TrueShot
              </span>
            </div>

            <HeroImage label="Your headshot" type="after" />
          </motion.div>
        </div>

        {/* Stats row */}
        <motion.div
          className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {[
            { value: '97%', label: 'Average identity score' },
            { value: '6', label: 'Professional style packs' },
            { value: '<15 min', label: 'Delivery time' },
            { value: '8 formats', label: 'One-click exports' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1 bg-background px-6 py-6 text-center">
              <span className="text-2xl font-semibold tracking-tight">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
