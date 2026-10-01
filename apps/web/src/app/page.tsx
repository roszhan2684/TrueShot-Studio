import type { Metadata } from 'next'
import { MarketingNav } from '@/components/marketing/nav'
import { Footer } from '@/components/marketing/footer'
import { HeroSection } from '@/components/marketing/sections/hero'
import { BeforeAfterSection } from '@/components/marketing/sections/before-after'
import { TrustSection } from '@/components/marketing/sections/trust'
import { WorkflowSection } from '@/components/marketing/sections/workflow'
import { UseCasesSection } from '@/components/marketing/sections/use-cases'
import { EditorPreviewSection } from '@/components/marketing/sections/editor-preview'
import { PrivacySection } from '@/components/marketing/sections/privacy'
import { PricingSection } from '@/components/marketing/sections/pricing'
import { FAQSection } from '@/components/marketing/sections/faq'
import { CTASection } from '@/components/marketing/sections/cta'

export const metadata: Metadata = {
  title: 'TrueShot Studio — AI Headshots That Look Like You',
  description:
    'Professional AI headshots with measurable identity accuracy. Upload 8–15 photos, generate across 6 styles, edit precisely, export in 8 formats.',
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1 pt-16">
        <HeroSection />
        <BeforeAfterSection />
        <TrustSection />
        <WorkflowSection />
        <UseCasesSection />
        <EditorPreviewSection />
        <PrivacySection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
