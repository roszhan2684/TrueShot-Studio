'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimateIn } from '../animate-in'

const FAQS = [
  {
    q: 'How many photos do I need to upload?',
    a: 'Between 8 and 15. More variety helps — we look for different angles, expressions, and lighting. TrueShot analyzes every photo and tells you if the set needs improvement before running generation.',
  },
  {
    q: 'How is identity accuracy measured?',
    a: "We derive face embeddings from your reference photos and compare every generated output against them. The identity similarity score tells you exactly how close each headshot is to your actual face — not a stylized version of it. Anything below our threshold is automatically rejected.",
  },
  {
    q: 'Will my photos be used to train AI models?',
    a: "No. Your reference photos, generated headshots, and face embeddings are never used for any training purpose. You can delete all your data at any time from the Settings page.",
  },
  {
    q: "What if I don't like any of the results?",
    a: "You can request a regeneration. If the quality of your reference photos was the issue, TrueShot will tell you specifically what to improve. Each generation is scored and ranked, so you always see the best outputs first.",
  },
  {
    q: 'How does the editing work without rerunning generation?',
    a: 'TrueShot uses targeted image editing operations for changes like background swap, lighting adjustment, and skin retouch. These are applied to the existing output, keeping identity stable. A full re-generation is only needed if you want a fundamentally different style.',
  },
  {
    q: 'Can I use TrueShot for my whole team?',
    a: "Yes. The Team plan gives you a shared workspace where each team member runs their own photoshoot, and all outputs are styled consistently. You can enforce a specific style pack to keep the team page looking uniform.",
  },
  {
    q: 'What export formats are available?',
    a: 'LinkedIn portrait (800×800), square avatar (400×400), team page card (600×600), speaker profile (1200×900), press kit 4K, transparent PNG cutout, grayscale PR variant, and email signature crop (300×300).',
  },
  {
    q: 'How long does generation take?',
    a: 'Typical generation time is 8–15 minutes depending on how many style packs you selected. You get a live progress view and an email when your results are ready.',
  },
]

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className={cn('text-sm font-medium transition-colors', isOpen ? 'text-foreground' : 'text-foreground/80')}>
          {q}
        </span>
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-3xl px-6">
        <AnimateIn className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
          <h2 className="text-4xl font-semibold tracking-tight">Common questions</h2>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <div>
            {FAQS.map((item, i) => (
              <FAQItem
                key={item.q}
                q={item.q}
                a={item.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
