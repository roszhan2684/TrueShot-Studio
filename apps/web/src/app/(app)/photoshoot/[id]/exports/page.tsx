import type { Metadata } from 'next'
import { ExportsPageClient } from './exports-page-client'

export const metadata: Metadata = { title: 'Export' }

export default function ExportsPage({ params }: { params: { id: string } }) {
  return <ExportsPageClient photoshootId={params.id} />
}
