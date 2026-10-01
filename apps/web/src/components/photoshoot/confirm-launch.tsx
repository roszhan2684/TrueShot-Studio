'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { usePhotoshootStore } from '@/stores/photoshoot.store'
import { photoshootsApi } from '@/lib/api'

interface ConfirmLaunchProps {
  photoshootId: string
}

export function ConfirmLaunch({ photoshootId }: ConfirmLaunchProps) {
  const router = useRouter()
  const { selectedStylePacks, uploadItems } = usePhotoshootStore()
  const [isLaunching, setIsLaunching] = useState(false)

  const doneCount = uploadItems.filter((i) => i.status === 'done').length
  const totalOutputs = selectedStylePacks.reduce((sum, p) => sum + p.outputCount, 0)

  const checks = [
    {
      label: 'Reference photos',
      value: `${doneCount} photo${doneCount !== 1 ? 's' : ''}`,
      ok: doneCount >= 8,
      issue: doneCount < 8 ? `Need ${8 - doneCount} more` : undefined,
    },
    {
      label: 'Style packs',
      value: selectedStylePacks.map((p) => p.name).join(', '),
      ok: selectedStylePacks.length > 0,
      issue: selectedStylePacks.length === 0 ? 'Choose at least one style' : undefined,
    },
    {
      label: 'Estimated outputs',
      value: `~${totalOutputs} headshots`,
      ok: true,
    },
    {
      label: 'Processing time',
      value: '~10–15 minutes',
      ok: true,
    },
  ]

  const canLaunch = checks.every((c) => c.ok)

  async function handleLaunch() {
    if (!canLaunch) return
    setIsLaunching(true)
    try {
      await photoshootsApi.getStatus(photoshootId) // Verify job still exists
      const result = await fetch(`/api/v1/photoshoots/${photoshootId}/validate`, { method: 'POST' })
      if (!result.ok) throw new Error('Validation failed')
      router.push(`/photoshoot/${photoshootId}/progress`)
    } catch {
      toast.error('Failed to start generation. Please try again.')
      setIsLaunching(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h3 className="text-base font-semibold">Review and start</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm everything looks right before generating your headshots.
        </p>
      </div>

      {/* Summary checklist */}
      <div className="mb-6 flex flex-col divide-y divide-border rounded-2xl border border-border bg-background">
        {checks.map(({ label, value, ok, issue }) => (
          <div key={label} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              {ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="text-right">
              <span className={cn('text-sm', ok ? 'text-foreground' : 'text-amber-600')}>
                {value}
              </span>
              {issue && (
                <p className="text-xs text-amber-500">{issue}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="mb-6 rounded-xl bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground">
        By starting generation, you confirm these photos are of yourself or you have consent to
        use them. Your reference photos are never used to train AI models and can be deleted at
        any time from Settings.
      </div>

      {/* Launch button */}
      <motion.button
        onClick={handleLaunch}
        disabled={!canLaunch || isLaunching}
        whileHover={canLaunch && !isLaunching ? { scale: 1.01 } : {}}
        whileTap={canLaunch && !isLaunching ? { scale: 0.99 } : {}}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition-all',
          canLaunch && !isLaunching
            ? 'bg-brand-900 text-white hover:bg-brand-700'
            : 'cursor-not-allowed bg-muted text-muted-foreground'
        )}
      >
        {isLaunching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting generation…
          </>
        ) : (
          <>
            Generate headshots
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </motion.button>

      {!canLaunch && (
        <p className="mt-3 text-center text-xs text-amber-600">
          Fix the issues above before generating.
        </p>
      )}
    </div>
  )
}
