import type { Metadata } from 'next'
import { ResultsPageClient } from './results-page-client'

export const metadata: Metadata = { title: 'Results' }

export default function ResultsPage({ params }: { params: { id: string } }) {
  return <ResultsPageClient photoshootId={params.id} />
}
