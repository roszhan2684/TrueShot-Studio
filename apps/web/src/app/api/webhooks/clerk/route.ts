import { NextResponse } from 'next/server'
// Demo mode — Clerk webhooks disabled
export async function POST() {
  return NextResponse.json({ received: true })
}
