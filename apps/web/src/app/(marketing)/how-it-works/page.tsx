import type { Metadata } from 'next'
import { WorkflowSection } from '@/components/marketing/sections/workflow'
import { TrustSection } from '@/components/marketing/sections/trust'
import { CTASection } from '@/components/marketing/sections/cta'

export const metadata: Metadata = {
  title: 'How It Works',
  description: 'A transparent six-step pipeline: upload, identity profiling, generation, quality evaluation, editing, and export.',
}

export default function HowItWorksPage() {
  return (
    <>
      <div className="border-b border-border bg-background py-20 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Process</p>
        <h1 className="text-5xl font-semibold tracking-tight">How TrueShot works</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Six structured steps. Full transparency at every stage.
        </p>
      </div>
      <WorkflowSection />
      <TrustSection />
      <CTASection />
    </>
  )
}
