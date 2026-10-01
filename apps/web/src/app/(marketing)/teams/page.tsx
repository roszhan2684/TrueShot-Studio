import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Teams & Enterprise' }

export default function TeamsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">TrueShot for Teams</h1>
      <p className="mt-4 text-lg text-muted-foreground">Team plan landing — built in STEP 10.</p>
    </div>
  )
}
