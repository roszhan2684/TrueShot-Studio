import { Shield, Eye, Zap, Award } from 'lucide-react'
import { AnimateIn } from '../animate-in'

const VALUES = [
  {
    icon: Award,
    title: 'Identity-first scoring',
    body: 'Every generated headshot is automatically evaluated against your reference photos. We measure identity similarity, sharpness, natural eyes, and skin texture before you see a single result.',
  },
  {
    icon: Zap,
    title: 'Surgical editing, not randomness',
    body: 'Change the background, adjust lighting, refine skin retouch intensity — without rerunning generation. Edits are targeted and reversible, so you stay in control.',
  },
  {
    icon: Shield,
    title: 'Privacy you can verify',
    body: 'Your reference photos are never used to train AI models. Delete everything — uploads, outputs, embeddings — with one click. Data retention settings are yours to control.',
  },
  {
    icon: Eye,
    title: 'Transparent quality signals',
    body: 'We show you why a headshot ranked #1. Every score is broken down. No opaque magic — you see exactly what TrueShot evaluated.',
  },
]

export function TrustSection() {
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Why TrueShot
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            Better than existing tools because it gives you control, not just more images.
          </h2>
        </AnimateIn>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, body }, i) => (
            <AnimateIn key={title} delay={i * 0.08} className="flex flex-col gap-4 bg-background p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
