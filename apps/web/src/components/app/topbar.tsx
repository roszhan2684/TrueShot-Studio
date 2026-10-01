'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell, Plus } from 'lucide-react'

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/photoshoot': 'My Photoshoots',
  '/billing': 'Billing',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  for (const [prefix, title] of Object.entries(TITLES)) {
    if (pathname.startsWith(prefix)) return title
  }
  return 'TrueShot Studio'
}

export function AppTopbar() {
  const pathname = usePathname()

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-sm font-semibold">{getPageTitle(pathname)}</h1>

      <div className="flex items-center gap-3">
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <Link
          href="/photoshoot/new"
          className="flex items-center gap-1.5 rounded-md bg-brand-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-3.5 w-3.5" />
          New photoshoot
        </Link>
      </div>
    </header>
  )
}
