'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Loader2, XCircle, Clock, Sparkles, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useGenerationProgress } from '@/hooks/use-generation-progress'
import { photoshootsApi } from '@/lib/api'

interface Props {
  photoshootId: string
}

const PIPELINE_STEPS = [
  { key: 'intake', label: 'Photo intake', statuses: ['validating'] },
  { key: 'queued', label: 'Queued', statuses: ['queued'] },
  { key: 'generating', label: 'Generating', statuses: ['generating'] },
  { key: 'evaluating', label: 'Evaluating', statuses: ['evaluating'] },
  { key: 'complete', label: 'Complete', statuses: ['completed'] },
]

function stepState(key: string, status: string): 'done' | 'active' | 'pending' | 'error' {
  if (status === 'failed' || status === 'cancelled') return 'error'
  const order = ['validating', 'queued', 'generating', 'evaluating', 'completed']
  const stepIdx = PIPELINE_STEPS.findIndex((s) => s.key === key)
  const currentIdx = order.indexOf(status)
  const activatedAt = PIPELINE_STEPS[stepIdx]?.statuses[0]
  const activatedIdx = order.indexOf(activatedAt ?? '')
  if (currentIdx > activatedIdx) return 'done'
  if (currentIdx === activatedIdx) return 'active'
  return 'pending'
}

export function ProgressPageClient({ photoshootId }: Props) {
  const router = useRouter()
  const redirectedRef = useRef(false)
  const { data: progress, isLoading } = useGenerationProgress(photoshootId)

  // Auto-redirect when complete
  useEffect(() => {
    if (!redirectedRef.current && progress?.status === 'completed') {
      redirectedRef.current = true
      setTimeout(() => router.push(`/photoshoot/${photoshootId}/results`), 1200)
    }
    if (progress?.status === 'failed') {
      toast.error(progress.errorMessage ?? 'Generation failed. Please try again.')
    }
  }, [progress?.status, photoshootId, router, progress?.errorMessage])

  const pct = progress
    ? progress.totalOutputs > 0
      ? Math.round((progress.completedOutputs / progress.totalOutputs) * 100)
      : statusPct(progress.status)
    : 0

  async function handleCancel() {
    try {
      await photoshootsApi.cancel(photoshootId)
      router.push('/dashboard')
    } catch {
      toast.error('Could not cancel the job.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const status = progress?.status ?? 'queued'
  const isFailed = status === 'failed' || status === 'cancelled'
  const isComplete = status === 'completed'

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Radial progress ring */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <ProgressRing pct={pct} failed={isFailed} complete={isComplete} />

          <div className="text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              {isComplete
                ? 'Headshots ready!'
                : isFailed
                  ? status === 'cancelled' ? 'Job cancelled' : 'Generation failed'
                  : 'Generating your headshots'}
            </h2>
            {progress?.currentStep && !isComplete && !isFailed && (
              <p className="mt-1 text-sm text-muted-foreground">{progress.currentStep}</p>
            )}
            {isComplete && (
              <p className="mt-1 text-sm text-muted-foreground">
                {progress?.qualityPassCount} headshots passed quality review — redirecting…
              </p>
            )}
          </div>
        </div>

        {/* Live output counter */}
        {!isFailed && progress && progress.totalOutputs > 0 && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium">
              {progress.completedOutputs}
              <span className="text-muted-foreground"> / {progress.totalOutputs} headshots generated</span>
            </span>
          </div>
        )}

        {/* Pipeline steps */}
        <div className="mb-8 rounded-2xl border border-border bg-background">
          {PIPELINE_STEPS.map((step, idx) => {
            const state = isFailed ? 'error' : stepState(step.key, status)
            return (
              <div
                key={step.key}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5',
                  idx < PIPELINE_STEPS.length - 1 && 'border-b border-border',
                )}
              >
                <StepIcon state={state} />
                <span
                  className={cn(
                    'text-sm',
                    state === 'active' && 'font-semibold text-foreground',
                    state === 'done' && 'text-muted-foreground',
                    state === 'pending' && 'text-muted-foreground/50',
                    state === 'error' && 'text-destructive',
                  )}
                >
                  {step.label}
                </span>
                {state === 'active' && (
                  <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </div>
            )
          })}
        </div>

        {/* Recent previews (placeholder tiles, ids arrive via progress) */}
        {progress && progress.recentHeadshotIds.length > 0 && (
          <div className="mb-8">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Preview
            </p>
            <div className="grid grid-cols-4 gap-2">
              <AnimatePresence initial={false}>
                {progress.recentHeadshotIds.slice(-8).map((id) => (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="aspect-square rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden"
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ETA */}
        {!isFailed && !isComplete && (
          <div className="mb-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {status === 'queued'
              ? 'Usually ready in 10–15 minutes'
              : status === 'evaluating'
                ? 'Almost done — scoring results…'
                : 'Estimated 10–15 minutes total'}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          {isComplete && (
            <button
              onClick={() => router.push(`/photoshoot/${photoshootId}/results`)}
              className="rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              View results
            </button>
          )}
          {isFailed && (
            <button
              onClick={() => router.push(`/photoshoot/${photoshootId}/upload`)}
              className="rounded-xl bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Try again
            </button>
          )}
          {!isComplete && !isFailed && (
            <button
              onClick={handleCancel}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressRing({
  pct,
  failed,
  complete,
}: {
  pct: number
  failed: boolean
  complete: boolean
}) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)

  return (
    <div className="relative h-36 w-36">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={failed ? 'var(--destructive)' : complete ? '#22c55e' : 'var(--brand-700, #4f46e5)'}
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {failed ? (
          <XCircle className="h-8 w-8 text-destructive" />
        ) : complete ? (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : (
          <>
            <span className="text-2xl font-bold tabular-nums">{pct}</span>
            <span className="text-xs text-muted-foreground">%</span>
          </>
        )}
      </div>
    </div>
  )
}

function StepIcon({ state }: { state: 'done' | 'active' | 'pending' | 'error' }) {
  if (state === 'done')
    return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
  if (state === 'error')
    return <XCircle className="h-4 w-4 shrink-0 text-destructive" />
  if (state === 'active')
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        <span className="h-2 w-2 rounded-full bg-brand-700 ring-2 ring-brand-700/30 animate-pulse" />
      </span>
    )
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/25" />
    </span>
  )
}

function statusPct(status: string): number {
  return (
    { draft: 0, uploading: 5, validating: 10, queued: 12, generating: 55, evaluating: 88, completed: 100 }[status] ?? 0
  )
}
