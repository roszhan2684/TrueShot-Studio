import type { Metadata } from 'next'
import { BeforeAfterSection } from '@/components/marketing/sections/before-after'
import { CTASection } from '@/components/marketing/sections/cta'

export const metadata: Metadata = {
  title: 'Examples',
  description: 'See real before & after comparisons across six professional styles with identity accuracy scores.',
}

export default function ExamplesPage() {
  return (
    <>
      <div className="border-b border-border bg-background py-20 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Results</p>
        <h1 className="text-5xl font-semibold tracking-tight">Before &amp; After</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Real results across six professional styles, each scored for identity accuracy.
        </p>
      </div>
      <BeforeAfterSection />
      <CTASection />
    </>
  )
}
