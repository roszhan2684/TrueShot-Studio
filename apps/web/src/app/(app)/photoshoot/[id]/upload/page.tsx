import type { Metadata } from 'next'
import { UploadPageClient } from './upload-page-client'

export const metadata: Metadata = { title: 'Upload Photos' }

export default function UploadPage({ params }: { params: { id: string } }) {
  return <UploadPageClient photoshootId={params.id} />
}
