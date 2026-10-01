'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { APP_NAME, NAV_MARKETING } from '@/lib/constants'

export function MarketingNav() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-brand-900" />
          <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_MARKETING.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm transition-colors hover:text-foreground',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <Link
            href="/photoshoot/new"
            className="rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Try it now
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border/40 bg-background/95 md:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {NAV_MARKETING.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                <Link href="/dashboard" className="text-sm text-muted-foreground">Dashboard</Link>
                <Link
                  href="/photoshoot/new"
                  className="rounded-md bg-brand-900 px-4 py-2 text-center text-sm font-medium text-white"
                >
                  Try it now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
