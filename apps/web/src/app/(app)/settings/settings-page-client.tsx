'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ChevronRight,
  Loader2,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { privacyApi } from '@/lib/api'

type Tab = 'profile' | 'privacy' | 'data'

export function SettingsPageClient() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Settings</h2>

      {/* Tab nav */}
      <div className="mb-8 flex gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {(
          [
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'privacy', label: 'Privacy', icon: Shield },
            { key: 'data', label: 'Data & deletion', icon: Trash2 },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all ${
              tab === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <ProfileTab />}
      {tab === 'privacy' && <PrivacyTab />}
      {tab === 'data' && <DataTab />}
    </div>
  )
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <Section title="Profile information">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-brand-700/10">
            <User className="h-7 w-7 text-brand-700" />
          </div>
          <div>
            <p className="font-semibold">Demo User</p>
            <p className="text-sm text-muted-foreground">demo@trueshot.ai</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Running in demo mode — no account required.
        </p>
        <a
          href="#"
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
        >
          Edit profile <ChevronRight className="h-4 w-4" />
        </a>
      </Section>
    </div>
  )
}

function PrivacyTab() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['privacy-settings'],
    queryFn: () => privacyApi.getSettings(),
  })

  return (
    <div className="space-y-6">
      <Section title="Data retention">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            <SettingRow
              label="Reference photos"
              description="How long we keep your uploaded reference images"
              value="30 days after photoshoot"
            />
            <SettingRow
              label="Generated headshots"
              description="How long your results are stored"
              value="Until you delete them"
            />
            <SettingRow
              label="Edit results"
              description="Edited versions of your headshots"
              value="Until you delete them"
            />
            <SettingRow
              label="Export files"
              description="Downloaded export files"
              value="7 days after creation"
            />
          </div>
        )}
      </Section>

      <Section title="Audit log">
        <p className="mb-3 text-sm text-muted-foreground">
          A record of all actions taken on your account. Retained for 90 days.
        </p>
        <AuditLog />
      </Section>
    </div>
  )
}

function DataTab() {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await privacyApi.requestDeletion()
      setDeleted(true)
      toast.success('Data deletion scheduled. You will receive an email confirmation.')
    } catch {
      toast.error('Could not process deletion request. Contact support@trueshot.ai.')
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <Section title="Export your data">
        <p className="text-sm text-muted-foreground">
          Download a copy of all data associated with your account including headshots, edits,
          audit logs, and billing history.
        </p>
        <button
          className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          onClick={() => toast.info('Data export — coming soon')}
        >
          Request data export
        </button>
      </Section>

      <Section title="Delete account">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="mb-3 flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-sm text-destructive">
              Deleting your account will permanently remove all your headshots, reference photos,
              edits, and billing history. This cannot be undone.
            </p>
          </div>

          {deleted ? (
            <p className="text-sm font-medium text-green-600">
              Deletion request received. Your account will be deleted within 30 days.
            </p>
          ) : confirming ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              Request account deletion
            </button>
          )}
        </div>
      </Section>
    </div>
  )
}

function AuditLog() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log'],
    queryFn: () => privacyApi.getAuditLog(),
  })

  const events = data?.items ?? []

  if (isLoading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
  if (events.length === 0) return <p className="text-sm text-muted-foreground">No audit events yet.</p>

  return (
    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
      {events.slice(0, 10).map((event: Record<string, unknown>) => (
        <div key={event.id as string} className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-medium">{event.action as string}</p>
            <p className="text-[11px] text-muted-foreground">{event.resource_type as string}</p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {new Date(event.created_at as string).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function SettingRow({
  label,
  description,
  value,
}: {
  label: string
  description: string
  value: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{value}</span>
    </div>
  )
}
