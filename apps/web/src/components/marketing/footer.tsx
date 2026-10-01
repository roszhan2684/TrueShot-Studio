import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

const LINKS = {
  Product: [
    { label: 'How it works', href: '/how-it-works' },
    { label: 'Examples', href: '/examples' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Teams', href: '/teams' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  Company: [
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: 'mailto:hello@trueshot.studio' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-brand-900" />
              <span className="text-sm font-semibold">{APP_NAME}</span>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Professional headshots that look like you — not an AI version of you.
            </p>
          </div>
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {category}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Privacy-first. Your photos are never used to train AI models.
          </p>
        </div>
      </div>
    </footer>
  )
}
