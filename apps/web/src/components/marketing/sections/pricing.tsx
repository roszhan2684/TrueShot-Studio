'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimateIn } from '../animate-in'

const PLANS = [
  {
    name: 'Starter',
    price: 29,
    annualPrice: 23,
    description: 'Perfect for individuals who need great headshots once or twice a year.',
    photoshoots: 1,
    outputs: 8,
    features: [
      '1 photoshoot per month',
      '8 headshots, ranked by quality',
      '2 style packs',
      '5 free exports',
      'Background & lighting edits',
      'Email signature export',
      'LinkedIn portrait export',
      'Data deleted on request',
    ],
    cta: 'Start with Starter',
    isPopular: false,
  },
  {
    name: 'Pro',
    price: 79,
    annualPrice: 63,
    description: 'For professionals who need headshots that keep up with career momentum.',
    photoshoots: 5,
    outputs: 20,
    features: [
      '5 photoshoots per month',
      '20 headshots per shoot, ranked',
      'All 6 style packs',
      'Unlimited exports (all formats)',
      'All 14 edit types',
      'Press kit 4K export',
      'Transparent PNG cutout',
      'Priority generation queue',
      'Data retention settings',
    ],
    cta: 'Start with Pro',
    isPopular: true,
  },
  {
    name: 'Team',
    price: 199,
    annualPrice: 159,
    description: 'Consistent headshots for your whole team, managed in one workspace.',
    photoshoots: 20,
    outputs: 24,
    features: [
      '20 photoshoots per month',
      'Up to 10 team members',
      '24 headshots per shoot',
      'All 6 style packs',
      'Unlimited exports',
      'Team page brand pack',
      'Consistent style enforcement',
      'Admin workspace dashboard',
      'SSO-ready (enterprise)',
      'Audit log export',
      'Priority support',
    ],
    cta: 'Start with Team',
    isPopular: false,
  },
]

export function PricingSection() {
  const [annual, setAnnual] = useState(false)

  return (
    <section className="border-t border-border bg-background py-24" id="pricing">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-4 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pricing
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            No surprise charges.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            All plans include identity scoring, quality filtering, and the Smart Editing Studio.
          </p>
        </AnimateIn>

        {/* Billing toggle */}
        <AnimateIn delay={0.05} className="mb-12 flex justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-border p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                !annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                annual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Annual
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                annual ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
              )}>
                -20%
              </span>
            </button>
          </div>
        </AnimateIn>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan, i) => (
            <AnimateIn key={plan.name} delay={i * 0.08}>
              <div
                className={cn(
                  'relative flex flex-col rounded-2xl border p-8 transition-shadow',
                  plan.isPopular
                    ? 'border-foreground/30 shadow-premium'
                    : 'border-border hover:shadow-sm'
                )}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-brand-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-1 text-base font-semibold">{plan.name}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-8 flex items-baseline gap-1">
                  <motion.span
                    key={`${plan.name}-${annual}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-semibold tracking-tight"
                  >
                    ${annual ? plan.annualPrice : plan.price}
                  </motion.span>
                  <span className="text-sm text-muted-foreground">/ mo</span>
                  {annual && (
                    <span className="ml-1 text-xs text-muted-foreground">billed annually</span>
                  )}
                </div>

                <Link
                  href="/sign-up"
                  className={cn(
                    'mb-8 flex items-center justify-center rounded-lg py-3 text-sm font-semibold transition-all',
                    plan.isPopular
                      ? 'bg-brand-900 text-white hover:bg-brand-700'
                      : 'border border-border hover:border-foreground/30 hover:bg-muted'
                  )}
                >
                  {plan.cta}
                </Link>

                <ul className="flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          ))}
        </div>

        <AnimateIn delay={0.3} className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">
            Need more?{' '}
            <Link href="/teams" className="font-medium text-foreground underline underline-offset-2 hover:no-underline">
              Talk to us about enterprise pricing
            </Link>
          </p>
        </AnimateIn>
      </div>
    </section>
  )
}
