'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Download,
  Loader2,
  CheckCircle2,
  Lock,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHeadshots } from '@/hooks/use-headshots'
import { useHeadshotUrl } from '@/hooks/use-headshot-url'
import { exportsApi } from '@/lib/api'
import { EXPORT_SPECS } from '@trueshot/types'
import type { ExportAsset, ExportFormat } from '@trueshot/types'

interface Props {
  photoshootId: string
}

export function ExportsPageClient({ photoshootId }: Props) {
  const qc = useQueryClient()
  const { data: headshotsData, isLoading: hsLoading } = useHeadshots(photoshootId)
  const [selectedHeadshotId, setSelectedHeadshotId] = useState<string | null>(null)

  const headshots = (headshotsData?.items ?? []).filter((h) => !h.isRejected)
  const activeHeadshot =
    headshots.find((h) => h.id === selectedHeadshotId) ?? headshots[0] ?? null

  const { data: exports, isLoading: exLoading } = useQuery<ExportAsset[]>({
    queryKey: ['exports', activeHeadshot?.id],
    queryFn: () => exportsApi.list(activeHeadshot!.id),
    enabled: !!activeHeadshot,
  })

  const { mutate: createExport, isPending } = useMutation({
    mutationFn: (format: ExportFormat) => exportsApi.create(activeHeadshot!.id, format),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exports', activeHeadshot?.id] })
      toast.success('Export queued!')
    },
    onError: () => toast.error('Export failed. Try again.'),
  })

  const { data: previewUrl } = useHeadshotUrl(activeHeadshot?.storageKey)

  if (hsLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (headshots.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-2 text-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium">No headshots to export</p>
        <p className="text-sm text-muted-foreground">Complete a photoshoot first</p>
      </div>
    )
  }

  const existingByFormat = new Map((exports ?? []).map((e) => [e.format, e]))

  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border bg-background px-6 py-5">
        <h2 className="text-base font-semibold">Export headshots</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose a format and download your headshot
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left — headshot picker + preview */}
        <div className="flex w-64 shrink-0 flex-col border-r border-border">
          <div className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select headshot
            </p>
            <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 260 }}>
              {headshots.map((h) => (
                <HeadshotPickerRow
                  key={h.id}
                  storageKey={h.thumbnailKey}
                  label={`#${h.rank} — ${h.stylePackId.replace(/-/g, ' ')}`}
                  active={activeHeadshot?.id === h.id}
                  onClick={() => setSelectedHeadshotId(h.id)}
                />
              ))}
            </div>
          </div>
          {previewUrl && (
            <div className="mx-4 mb-4 overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected headshot" className="w-full object-cover" />
            </div>
          )}
        </div>

        {/* Right — format grid */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {EXPORT_SPECS.map((spec) => {
              const existing = existingByFormat.get(spec.format)
              return (
                <ExportCard
                  key={spec.format}
                  spec={spec}
                  existing={existing}
                  isLoading={isPending}
                  onExport={() => createExport(spec.format)}
                />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function ExportCard({
  spec,
  existing,
  isLoading,
  onExport,
}: {
  spec: (typeof EXPORT_SPECS)[number]
  existing: ExportAsset | undefined
  isLoading: boolean
  onExport: () => void
}) {
  const isComplete = existing?.status === 'completed'
  const isProcessing = existing?.status === 'queued' || existing?.status === 'processing'

  async function handleDownload() {
    if (!existing?.id) return
    try {
      const url = await exportsApi.getDownloadUrl(existing.id)
      window.open(url, '_blank')
    } catch {
      toast.error('Download link expired. Please re-export.')
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        'flex flex-col rounded-xl border border-border bg-background p-4 transition-shadow',
        spec.isPremium && 'opacity-80',
      )}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{spec.label}</p>
          <p className="text-xs text-muted-foreground">{spec.dimensions}</p>
        </div>
        {spec.isPremium && (
          <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Lock className="h-2.5 w-2.5" /> Pro
          </span>
        )}
      </div>

      <p className="mb-4 flex-1 text-xs text-muted-foreground">{spec.description}</p>

      {isComplete ? (
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-900 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </button>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </div>
      ) : isProcessing ? (
        <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing…
        </div>
      ) : (
        <button
          onClick={onExport}
          disabled={isLoading || spec.isPremium}
          className={cn(
            'rounded-lg border border-border py-2 text-xs font-medium transition-colors',
            spec.isPremium
              ? 'cursor-not-allowed text-muted-foreground/50'
              : 'hover:bg-muted',
          )}
        >
          {spec.isPremium ? 'Upgrade to export' : 'Export'}
        </button>
      )}
    </motion.div>
  )
}

function HeadshotPickerRow({
  storageKey,
  label,
  active,
  onClick,
}: {
  storageKey: string
  label: string
  active: boolean
  onClick: () => void
}) {
  const { data: url } = useHeadshotUrl(storageKey)
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
        active ? 'bg-brand-700/10 font-semibold text-brand-700' : 'hover:bg-muted',
      )}
    >
      <div className="h-8 w-6 shrink-0 overflow-hidden rounded border border-border">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <span className="truncate capitalize">{label}</span>
    </button>
  )
}
