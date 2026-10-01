import type { Metadata } from 'next'
import { PricingSection } from '@/components/marketing/sections/pricing'
import { FAQSection } from '@/components/marketing/sections/faq'
import { CTASection } from '@/components/marketing/sections/cta'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Starter from $29/mo. Pro from $79/mo. Team from $199/mo. All plans include identity scoring and the Smart Editing Studio.',
}

export default function PricingPage() {
  return (
    <>
      <div className="border-b border-border bg-background pb-2 pt-20 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">Simple, honest pricing</h1>
        <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
          Every plan includes quality scoring, identity evaluation, and the Smart Editing Studio. No feature walls on the things that matter.
        </p>
      </div>
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
