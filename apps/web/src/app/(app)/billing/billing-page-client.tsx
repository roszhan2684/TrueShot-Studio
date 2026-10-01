'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { billingApi } from '@/lib/api'
import type { PricingPlan, Subscription } from '@trueshot/types'

interface PlanConfig {
  plan: PricingPlan
  name: string
  monthlyPrice: number
  annualPrice: number
  icon: React.ElementType
  features: string[]
  isPopular: boolean
  stripePriceId: string
  stripeAnnualPriceId: string
}

const PLANS: PlanConfig[] = [
  {
    plan: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 22,
    icon: Zap,
    isPopular: false,
    stripePriceId: 'price_starter_monthly',
    stripeAnnualPriceId: 'price_starter_annual',
    features: [
      '2 photoshoots / month',
      '16 headshots per shoot',
      '3 style packs',
      '5 exports / month',
      'Email support',
    ],
  },
  {
    plan: 'pro',
    name: 'Pro',
    monthlyPrice: 79,
    annualPrice: 59,
    icon: Sparkles,
    isPopular: true,
    stripePriceId: 'price_pro_monthly',
    stripeAnnualPriceId: 'price_pro_annual',
    features: [
      '10 photoshoots / month',
      '32 headshots per shoot',
      'All 6 style packs',
      'Unlimited exports',
      'Smart editor — all tools',
      'Priority generation queue',
      'Priority support',
    ],
  },
  {
    plan: 'team',
    name: 'Team',
    monthlyPrice: 199,
    annualPrice: 149,
    icon: Users,
    isPopular: false,
    stripePriceId: 'price_team_monthly',
    stripeAnnualPriceId: 'price_team_annual',
    features: [
      'Up to 10 team members',
      'Unlimited photoshoots',
      'Brand workspace',
      'Team page brand pack',
      'Shared asset library',
      'Dedicated onboarding',
      'SLA support',
    ],
  },
]

export function BillingPageClient() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const { data: subscription, isLoading } = useQuery<Subscription | null>({
    queryKey: ['subscription'],
    queryFn: () => billingApi.getSubscription(),
  })

  async function handleCheckout(plan: PlanConfig) {
    setCheckoutLoading(plan.plan)
    try {
      const priceId = isAnnual ? plan.stripeAnnualPriceId : plan.stripePriceId
      const { url } = await billingApi.createCheckoutSession(priceId, isAnnual)
      window.location.href = url
    } catch {
      toast.error('Could not start checkout. Please try again.')
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { url } = await billingApi.createPortalSession()
      window.open(url, '_blank')
    } catch {
      toast.error('Could not open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  const currentPlan = subscription?.plan ?? null

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight">Plans & Billing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upgrade to unlock more photoshoots, exports, and premium features.
        </p>
      </div>

      {/* Current subscription card */}
      {isLoading ? (
        <div className="mb-8 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading subscription…</span>
        </div>
      ) : subscription ? (
        <div className="mb-8 rounded-2xl border border-border bg-background p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700/10">
                <CreditCard className="h-5 w-5 text-brand-700" />
              </div>
              <div>
                <p className="text-sm font-semibold capitalize">
                  {subscription.plan} plan —{' '}
                  <span
                    className={cn(
                      'text-xs',
                      subscription.status === 'active' ? 'text-green-600' : 'text-amber-600',
                    )}
                  >
                    {subscription.status}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {portalLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              Manage billing
            </button>
          </div>
        </div>
      ) : null}

      {/* Annual toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={cn('text-sm', !isAnnual && 'font-semibold')}>Monthly</span>
        <button
          onClick={() => setIsAnnual(!isAnnual)}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            isAnnual ? 'bg-brand-700' : 'bg-muted-foreground/30',
          )}
        >
          <motion.span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
            animate={{ left: isAnnual ? '1.375rem' : '0.125rem' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
        <span className={cn('text-sm', isAnnual && 'font-semibold')}>
          Annual
          <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Save 25%
          </span>
        </span>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.plan
          const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
          const isLoading = checkoutLoading === plan.plan

          return (
            <div
              key={plan.plan}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-shadow',
                plan.isPopular
                  ? 'border-brand-700 shadow-premium-dark'
                  : 'border-border',
              )}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-brand-700 px-3 py-1 text-[11px] font-bold text-white">
                    Most popular
                  </span>
                </div>
              )}

              <div className="mb-4 flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl',
                    plan.isPopular ? 'bg-brand-700 text-white' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <plan.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${price}</span>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                </div>
              </div>

              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="flex items-center justify-center rounded-xl bg-muted py-3 text-sm font-medium text-muted-foreground">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleCheckout(plan)}
                  disabled={!!checkoutLoading}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all',
                    plan.isPopular
                      ? 'bg-brand-900 text-white hover:bg-brand-700'
                      : 'border border-border hover:bg-muted',
                    !!checkoutLoading && 'cursor-not-allowed opacity-60',
                  )}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Prices in USD. Cancel anytime. Billed by Stripe — your payment info is never stored on our servers.
      </p>
    </div>
  )
}
