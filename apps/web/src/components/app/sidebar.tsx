'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Camera, CreditCard, Settings, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Photoshoots', href: '/photoshoot', icon: Camera },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-background">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <div className="h-6 w-6 rounded bg-brand-900" />
        <span className="text-sm font-semibold">{APP_NAME}</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-100 text-brand-900'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700/20">
          <User className="h-4 w-4 text-brand-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">Demo User</p>
          <p className="truncate text-[10px] text-muted-foreground">demo@trueshot.ai</p>
        </div>
      </div>
    </aside>
  )
}
