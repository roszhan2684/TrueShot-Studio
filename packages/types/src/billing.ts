export interface BillingCustomer {
  id: string
  userId: string
  stripeCustomerId: string
  createdAt: string
}

export interface Subscription {
  id: string
  userId: string
  workspaceId: string | null
  stripeSubscriptionId: string
  stripePriceId: string
  plan: PricingPlan
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'unpaid'
  | 'incomplete'

export type PricingPlan = 'starter' | 'pro' | 'team'

export interface PricingTier {
  plan: PricingPlan
  name: string
  price: number            // USD per month
  annualPrice: number      // USD per month billed annually
  stripePriceId: string
  stripeAnnualPriceId: string
  photoshoots: number      // per month
  outputsPerShoot: number
  editJobs: number         // per month
  exports: ExportAllocation
  features: string[]
  isPopular: boolean
}

export interface ExportAllocation {
  free: number
  premium: number          // -1 = unlimited
}
