import { NextResponse } from 'next/server'
// Demo mode — Stripe webhooks disabled
export async function POST() {
  return NextResponse.json({ received: true })
}
