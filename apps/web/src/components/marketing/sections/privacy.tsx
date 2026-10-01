import { Lock, Trash2, ToggleLeft, FileSearch } from 'lucide-react'
import { AnimateIn } from '../animate-in'

const PROMISES = [
  {
    icon: Lock,
    title: 'Never used to train AI',
    body: 'Your reference photos and generated headshots are never added to any training dataset. Full stop.',
  },
  {
    icon: Trash2,
    title: 'Delete everything, instantly',
    body: 'One click removes your uploads, generated headshots, identity embeddings, and all associated data. Verified deletion, not soft-delete.',
  },
  {
    icon: ToggleLeft,
    title: 'You control retention',
    body: 'Set how long your uploads and outputs are kept. Default is 30 days. Set it to 1 day or keep indefinitely — your choice.',
  },
  {
    icon: FileSearch,
    title: 'Audit-ready event log',
    body: 'Every action on your data is logged — who accessed what, when. Enterprise customers can export the full event log.',
  },
]

export function PrivacySection() {
  return (
    <section className="border-t border-border bg-brand-950 py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
            Privacy
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-white">
            Your face is not a data point.
          </h2>
          <p className="mt-4 text-base text-white/60">
            We built the privacy layer first, not as an afterthought. Here&apos;s exactly what we do — and don&apos;t do — with your data.
          </p>
        </AnimateIn>

        <div className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
          {PROMISES.map(({ icon: Icon, title, body }, i) => (
            <AnimateIn key={title} delay={i * 0.08} className="flex flex-col gap-4 bg-brand-950 p-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-5 w-5 text-white/70" />
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{body}</p>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn delay={0.2} className="mt-10 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">GDPR-ready deletion flow</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">CCPA compliant</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">SOC 2 in progress</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/70">Enterprise SSO ready</span>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
