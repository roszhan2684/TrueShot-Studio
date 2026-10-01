import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { AnimateIn } from '../animate-in'

export function CTASection() {
  return (
    <section className="border-t border-border bg-brand-950 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <AnimateIn>
          <h2 className="text-5xl font-semibold leading-tight tracking-tighter text-white">
            Your professional photo,
            <br />
            ready in 15 minutes.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/60">
            No studio booking. No photographer scheduling. No editing back-and-forth.
            Upload your photos now and get headshots that look like you.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-sm font-semibold text-brand-900 transition-all hover:bg-white/90 hover:shadow-xl"
            >
              Start for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/20 px-7 py-4 text-sm font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/30">
            No credit card required to start · Delete your data anytime
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
