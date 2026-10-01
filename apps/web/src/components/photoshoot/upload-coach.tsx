'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/utils/format'
import { useUpload } from '@/hooks/use-upload'
import { MIN_REFERENCE_IMAGES, MAX_REFERENCE_IMAGES, ACCEPTED_IMAGE_TYPES } from '@/lib/constants'

const TIPS = [
  'Include different facial expressions — neutral, slight smile, serious.',
  'Vary your lighting: natural light, indoor, outdoor.',
  'Include photos from slightly different angles, not just straight-on.',
  'Avoid heavy filters, sunglasses, or hats in most photos.',
  'Higher resolution is better — avoid blurry or very small photos.',
]

function QualityBadge({ score }: { score?: number }) {
  if (score === undefined) return null
  const pct = Math.round(score * 100)
  const variant = pct >= 70 ? 'good' : pct >= 40 ? 'ok' : 'poor'
  return (
    <span
      className={cn(
        'absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm',
        variant === 'good' && 'bg-green-900/70 text-green-300',
        variant === 'ok'   && 'bg-amber-900/70 text-amber-300',
        variant === 'poor' && 'bg-red-900/70 text-red-300'
      )}
    >
      {pct}%
    </span>
  )
}

function UploadThumbnail({
  item,
  onRemove,
}: {
  item: ReturnType<typeof useUpload>['uploadItems'][number]
  onRemove: () => void
}) {
  const preview = URL.createObjectURL(item.file)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
    >
      {/* Image preview */}
      <img src={preview} alt={item.file.name} className="h-full w-full object-cover" onLoad={() => URL.revokeObjectURL(preview)} />

      {/* Upload progress overlay */}
      {item.status === 'uploading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <Loader2 className="h-5 w-5 animate-spin text-white" />
          <span className="mt-1 text-xs font-medium text-white">{item.progress}%</span>
          <div className="absolute bottom-0 left-0 h-1 bg-white/30" style={{ width: '100%' }}>
            <div className="h-full bg-white transition-all" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {item.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-red-900/70 p-2">
          <AlertCircle className="h-5 w-5 text-red-200" />
          <p className="text-center text-[10px] text-red-200">{item.errorMessage}</p>
        </div>
      )}

      {/* Done checkmark */}
      {item.status === 'done' && (
        <div className="absolute right-1.5 top-1.5 rounded-full bg-green-500 p-0.5">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}

      {/* Quality score */}
      <QualityBadge score={item.qualityScore} />

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute left-1.5 top-1.5 hidden rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80 group-hover:flex"
        aria-label="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  )
}

export function UploadCoach({ photoshootId }: { photoshootId: string }) {
  const { uploadFiles, uploadItems, errors, removeUploadItem, doneCount, isUploading } =
    useUpload(photoshootId)

  const onDrop = useCallback(
    (accepted: File[]) => {
      const remaining = MAX_REFERENCE_IMAGES - uploadItems.length
      uploadFiles(accepted.slice(0, remaining))
    },
    [uploadFiles, uploadItems.length]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_IMAGE_TYPES.map((t) => [t, []])),
    maxSize: 20 * 1024 * 1024,
    disabled: uploadItems.length >= MAX_REFERENCE_IMAGES,
  })

  const atMin = doneCount >= MIN_REFERENCE_IMAGES
  const atMax = uploadItems.length >= MAX_REFERENCE_IMAGES

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Main upload area */}
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Upload reference photos</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {doneCount}/{MAX_REFERENCE_IMAGES} uploaded
              {atMin && <span className="ml-2 font-medium text-green-600">· Minimum reached ✓</span>}
            </p>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  atMin ? 'bg-green-500' : 'bg-brand-900'
                )}
                style={{ width: `${Math.min((doneCount / MIN_REFERENCE_IMAGES) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{MIN_REFERENCE_IMAGES} min</span>
          </div>
        </div>

        {/* Drop zone */}
        {!atMax && (
          <div
            {...getRootProps()}
            className={cn(
              'mb-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-8 py-10 text-center transition-colors',
              isDragActive
                ? 'border-brand-900 bg-brand-50'
                : 'border-border bg-muted/20 hover:border-foreground/30 hover:bg-muted/40'
            )}
          >
            <input {...getInputProps()} />
            <div className={cn('rounded-xl p-3', isDragActive ? 'bg-brand-100' : 'bg-muted')}>
              <Upload className={cn('h-6 w-6', isDragActive ? 'text-brand-900' : 'text-muted-foreground')} />
            </div>
            <div>
              <p className="text-sm font-medium">
                {isDragActive ? 'Drop photos here' : 'Drop photos or click to browse'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                JPEG, PNG, WebP · max 20 MB · {MAX_REFERENCE_IMAGES - uploadItems.length} remaining
              </p>
            </div>
          </div>
        )}

        {/* Upload errors */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-4"
            >
              {errors.map((e) => (
                <p key={e.fileName} className="text-xs text-red-700">
                  <span className="font-medium">{e.fileName}:</span> {e.reason}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thumbnail grid */}
        {uploadItems.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
            <AnimatePresence mode="popLayout">
              {uploadItems.map((item) => (
                <UploadThumbnail
                  key={item.id}
                  item={item}
                  onRemove={() => removeUploadItem(item.id)}
                />
              ))}
            </AnimatePresence>

            {/* Empty slots */}
            {uploadItems.length < MIN_REFERENCE_IMAGES &&
              Array.from({ length: MIN_REFERENCE_IMAGES - uploadItems.length }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-border"
                >
                  <ImageIcon className="h-4 w-4 text-border" />
                </div>
              ))}
          </div>
        )}

        {/* File size summary */}
        {uploadItems.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {uploadItems.length} photo{uploadItems.length !== 1 ? 's' : ''} ·{' '}
            {formatBytes(uploadItems.reduce((sum, i) => sum + i.file.size, 0))} total
            {isUploading && ' · Uploading…'}
          </p>
        )}
      </div>

      {/* Tips sidebar */}
      <div className="w-full shrink-0 lg:w-72">
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Photo tips
          </p>
          <ul className="flex flex-col gap-3">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5">
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <p className="text-xs leading-relaxed text-muted-foreground">{tip}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Quality legend */}
        <div className="mt-4 rounded-xl border border-border p-4">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">Quality score</p>
          <div className="flex flex-col gap-1.5">
            {[
              { color: 'bg-green-500', label: '70–100%', desc: 'Good — use it' },
              { color: 'bg-amber-500', label: '40–69%', desc: 'Acceptable' },
              { color: 'bg-red-500',   label: 'Below 40%', desc: 'Will be rejected' },
            ].map(({ color, label, desc }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className={cn('h-2 w-2 shrink-0 rounded-full', color)} />
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
