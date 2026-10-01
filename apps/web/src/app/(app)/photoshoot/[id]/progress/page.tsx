import type { Metadata } from 'next'
import { ProgressPageClient } from './progress-page-client'

export const metadata: Metadata = { title: 'Generating Headshots' }

export default function ProgressPage({ params }: { params: { id: string } }) {
  return <ProgressPageClient photoshootId={params.id} />
}
