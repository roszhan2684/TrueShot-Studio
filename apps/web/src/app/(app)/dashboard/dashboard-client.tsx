'use client'

import Link from 'next/link'
import { Camera, ImageIcon, Download, Plus, ArrowRight } from 'lucide-react'
import { usePhotoshoots } from '@/hooks/use-photoshoot'
import { PhotoshootCard, PhotoshootCardSkeleton } from '@/components/photoshoot/photoshoot-card'
import { EmptyState } from '@/components/app/empty-state'
import type { PhotoshootJob } from '@trueshot/types'

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

function computeStats(jobs: PhotoshootJob[]) {
  return {
    total: jobs.length,
    headshots: jobs.reduce((sum, j) => sum + j.qualityPassCount, 0),
    completed: jobs.filter((j) => j.status === 'completed').length,
  }
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export function DashboardClient() {
  const { data, isLoading } = usePhotoshoots()

  const jobs = data?.items ?? []
  const stats = computeStats(jobs)
  const recent = jobs.slice(0, 5)
  const hasActive = jobs.some((j) =>
    ['queued', 'generating', 'evaluating', 'validating'].includes(j.status)
  )

  return (
    <div className="p-6 pb-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Good {getTimeOfDay()}, Demo
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hasActive ? 'You have an active photoshoot in progress.' : "Here's your studio overview."}
          </p>
        </div>
        <Link
          href="/photoshoot/new"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New photoshoot
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Photoshoots" value={isLoading ? '—' : stats.total} icon={Camera} />
        <StatCard label="Headshots" value={isLoading ? '—' : stats.headshots} icon={ImageIcon} />
        <StatCard label="Completed" value={isLoading ? '—' : stats.completed} icon={Download} />
      </div>

      {hasActive && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <p className="text-sm font-medium text-amber-900">Generation in progress</p>
            <p className="text-sm text-amber-700">Your headshots are being created.</p>
          </div>
          <Link
            href={`/photoshoot/${jobs.find((j) => ['queued', 'generating', 'evaluating'].includes(j.status))?.id}/progress`}
            className="flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-900"
          >
            View progress <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent photoshoots</h3>
          {jobs.length > 5 && (
            <Link href="/photoshoot" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => <PhotoshootCardSkeleton key={i} />)}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Camera}
            title="No photoshoots yet"
            description="Upload 8–15 reference photos and TrueShot will generate professional headshots across your chosen styles."
            action={{ label: 'Start your first photoshoot', href: '/photoshoot/new' }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((job) => <PhotoshootCard key={job.id} job={job} />)}
          </div>
        )}
      </div>
    </div>
  )
}
