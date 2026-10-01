'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sliders, ImageIcon, Sun, Scissors, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimateIn } from '../animate-in'

const EDIT_TABS = [
  { id: 'background', label: 'Background', icon: ImageIcon },
  { id: 'lighting', label: 'Lighting', icon: Sun },
  { id: 'retouch', label: 'Retouch', icon: Sliders },
  { id: 'crop', label: 'Crop', icon: Scissors },
  { id: 'expression', label: 'Expression', icon: Smile },
]

const BG_PRESETS = [
  { label: 'White studio', color: '#f8f8f7' },
  { label: 'Light grey', color: '#d4d4d8' },
  { label: 'Charcoal', color: '#3f3f46' },
  { label: 'Dark', color: '#18181b' },
  { label: 'Warm beige', color: '#d6c8b6' },
]

function EditorPanel({ activeTab }: { activeTab: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col gap-4"
      >
        {activeTab === 'background' && (
          <>
            <p className="text-xs font-medium text-muted-foreground">Background preset</p>
            <div className="flex flex-wrap gap-2">
              {BG_PRESETS.map((p, i) => (
                <button
                  key={p.label}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all hover:border-foreground/30',
                    i === 0 ? 'border-foreground/30 ring-1 ring-foreground/20' : 'border-border'
                  )}
                >
                  <div
                    className="h-10 w-10 rounded-lg border border-border/40"
                    style={{ background: p.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Background blur</span>
                <span className="text-xs font-medium">0</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-0 rounded-full bg-foreground" />
              </div>
            </div>
          </>
        )}
        {activeTab === 'retouch' && (
          <>
            <p className="text-xs font-medium text-muted-foreground">Skin retouch intensity</p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-[10px] text-muted-foreground">Subtle</span>
                <span className="text-[10px] text-muted-foreground">Strong</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[30%] rounded-full bg-foreground" />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Default is 30% — enough to clean minor blemishes without altering your appearance.
              </p>
            </div>
            {['Flyaway removal', 'Blemish cleanup', 'Under-eye reduction', 'Hair cleanup'].map((opt) => (
              <div key={opt} className="flex items-center justify-between py-1">
                <span className="text-xs">{opt}</span>
                <div className="h-4 w-8 rounded-full bg-muted" />
              </div>
            ))}
          </>
        )}
        {activeTab === 'lighting' && (
          <>
            <p className="text-xs font-medium text-muted-foreground">Lighting preset</p>
            <div className="grid grid-cols-2 gap-2">
              {['Natural window', 'Studio soft box', 'Warm golden', 'Cool daylight'].map((l, i) => (
                <button
                  key={l}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left text-xs transition-all',
                    i === 0 ? 'border-foreground/30 bg-muted font-medium' : 'border-border text-muted-foreground hover:border-foreground/20'
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </>
        )}
        {(activeTab === 'crop' || activeTab === 'expression') && (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="rounded-xl bg-muted p-3">
              {activeTab === 'crop' ? <Scissors className="h-5 w-5 text-muted-foreground" /> : <Smile className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="text-sm font-medium">
              {activeTab === 'crop' ? 'Crop & reframe' : 'Smile adjustment'}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeTab === 'crop'
                ? 'Choose aspect ratio and drag the focus point.'
                : 'Fine-tune smile intensity without changing facial structure.'}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export function EditorPreviewSection() {
  const [activeTab, setActiveTab] = useState('background')

  return (
    <section className="border-t border-border bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Smart Editing Studio
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Edit precisely. Not randomly.
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Change background, lighting, or skin retouch intensity without touching identity.
            Every edit is targeted, reversible, and fast — no generation rerun needed.
          </p>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-premium">
            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-border" />
                <div className="h-3 w-3 rounded-full bg-border" />
                <div className="h-3 w-3 rounded-full bg-border" />
              </div>
              <p className="ml-3 text-xs text-muted-foreground">TrueShot Studio — Editor</p>
            </div>

            <div className="grid md:grid-cols-[2fr_1fr]">
              {/* Preview canvas */}
              <div className="relative flex items-center justify-center bg-zinc-50 p-12">
                <div className="relative aspect-[3/4] w-48 overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-premium">
                  <div className="absolute bottom-0 inset-x-0 h-2/3 rounded-t-3xl bg-zinc-300/50" />
                  <div className="absolute inset-x-0 top-[18%] flex justify-center">
                    <div className="h-[30%] w-[45%] rounded-full bg-zinc-400/70" style={{ aspectRatio: '1' }} />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-background/90 px-3 py-1.5 backdrop-blur-sm">
                  <p className="text-[10px] font-medium text-muted-foreground">Identity locked · Editing background</p>
                </div>
              </div>

              {/* Controls panel */}
              <div className="flex flex-col border-l border-border">
                {/* Edit type tabs */}
                <div className="flex flex-wrap gap-1 border-b border-border p-3">
                  {EDIT_TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                        activeTab === id
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* Panel content */}
                <div className="flex-1 p-5">
                  <EditorPanel activeTab={activeTab} />
                </div>

                {/* Apply */}
                <div className="border-t border-border p-4">
                  <button className="w-full rounded-lg bg-brand-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700">
                    Apply edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
