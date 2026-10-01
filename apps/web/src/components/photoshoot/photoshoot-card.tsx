import Link from 'next/link'
import { formatDate, formatRelative } from '@/lib/utils/format'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Camera, ChevronRight, ImageIcon } from 'lucide-react'
import type { PhotoshootJob, PhotoshootStatus } from '@trueshot/types'

const STATUS_CONFIG: Record<
  PhotoshootStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  draft:       { label: 'Draft',       variant: 'secondary' },
  uploading:   { label: 'Uploading',   variant: 'secondary' },
  validating:  { label: 'Validating',  variant: 'secondary' },
  queued:      { label: 'Queued',      variant: 'warning'   },
  generating:  { label: 'Generating',  variant: 'warning'   },
  evaluating:  { label: 'Evaluating',  variant: 'warning'   },
  completed:   { label: 'Complete',    variant: 'success'   },
  failed:      { label: 'Failed',      variant: 'destructive' },
  cancelled:   { label: 'Cancelled',   variant: 'outline'   },
}

function getHref(job: PhotoshootJob): string {
  if (job.status === 'draft' || job.status === 'uploading') return `/photoshoot/${job.id}/upload`
  if (job.status === 'completed') return `/photoshoot/${job.id}/results`
  return `/photoshoot/${job.id}/progress`
}

export function PhotoshootCard({ job }: { job: PhotoshootJob }) {
  const config = STATUS_CONFIG[job.status]
  const href = getHref(job)
  const isActive = ['queued', 'generating', 'evaluating', 'validating'].includes(job.status)

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-all hover:border-foreground/20 hover:shadow-sm"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border',
          job.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-border bg-muted'
        )}
      >
        {job.status === 'completed' ? (
          <ImageIcon className="h-5 w-5 text-green-600" />
        ) : (
          <Camera className={cn('h-5 w-5', isActive ? 'text-amber-500' : 'text-muted-foreground')} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">
            {job.title ?? `Photoshoot ${formatDate(job.createdAt)}`}
          </p>
          <Badge variant={config.variant} className="shrink-0">
            {config.label}
          </Badge>
          {isActive && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{job.stylePackIds.length} style pack{job.stylePackIds.length !== 1 ? 's' : ''}</span>
          {job.qualityPassCount > 0 && (
            <span>{job.qualityPassCount} headshots</span>
          )}
          <span>{formatRelative(job.createdAt)}</span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

export function PhotoshootCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-5">
      <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
