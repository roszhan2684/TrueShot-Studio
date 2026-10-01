import type { Subscription } from '@trueshot/types'
import { apiClient } from './client'

export const billingApi = {
  getSubscription(): Promise<Subscription | null> {
    return apiClient.get('/billing/subscription').then((r) => r.data.data)
  },

  createCheckoutSession(priceId: string, isAnnual: boolean): Promise<{ url: string }> {
    return apiClient
      .post('/billing/checkout', { price_id: priceId, is_annual: isAnnual })
      .then((r) => r.data.data)
  },

  createPortalSession(): Promise<{ url: string }> {
    return apiClient.post('/billing/portal').then((r) => r.data.data)
  },
}
