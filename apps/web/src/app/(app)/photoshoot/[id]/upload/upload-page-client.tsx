'use client'

import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { UploadCoach } from '@/components/photoshoot/upload-coach'
import { usePhotoshoot } from '@/hooks/use-photoshoot'
import { usePhotoshootStore } from '@/stores/photoshoot.store'
import { photoshootsApi } from '@/lib/api'
import { MIN_REFERENCE_IMAGES } from '@/lib/constants'

export function UploadPageClient({ photoshootId }: { photoshootId: string }) {
  const router = useRouter()
  const { data: job, isLoading } = usePhotoshoot(photoshootId)
  const { uploadItems } = usePhotoshootStore()
  const [isLaunching, setIsLaunching] = useState(false)

  const doneCount = uploadItems.filter((i) => i.status === 'done').length
  const canLaunch = doneCount >= MIN_REFERENCE_IMAGES

  async function handleLaunch() {
    if (!canLaunch) return
    setIsLaunching(true)
    try {
      await photoshootsApi.validate(photoshootId)
      router.push(`/photoshoot/${photoshootId}/progress`)
    } catch {
      toast.error('Could not start generation. Please try again.')
      setIsLaunching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border bg-background px-6 py-5">
        <h2 className="text-base font-semibold">Upload reference photos</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {job?.title ?? `Photoshoot — ${photoshootId.slice(-6)}`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <UploadCoach photoshootId={photoshootId} />
        </div>
      </div>

      <div className="border-t border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {doneCount} of {MIN_REFERENCE_IMAGES}+ photos uploaded
          </p>
          <button
            onClick={handleLaunch}
            disabled={!canLaunch || isLaunching}
            className="flex items-center gap-1.5 rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLaunching ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Starting…</>
            ) : (
              <>Generate headshots <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
