import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; href: string }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-background px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
