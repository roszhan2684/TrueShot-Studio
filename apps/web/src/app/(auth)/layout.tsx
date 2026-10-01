import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-brand-900" />
          <span className="text-sm font-semibold">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4">{children}</main>
    </div>
  )
}
