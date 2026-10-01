import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { EditorPageClient } from './editor-page-client'

export const metadata: Metadata = { title: 'Editor' }

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <EditorPageClient photoshootId={params.id} />
    </Suspense>
  )
}
