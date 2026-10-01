import { Linkedin, FileText, Users, Rocket, Mic, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AnimateIn } from '../animate-in'

const USE_CASES = [
  {
    icon: Linkedin,
    label: 'LinkedIn profile',
    description: 'First impressions matter. A sharp, professional headshot gets more profile views and connection acceptance.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: FileText,
    label: 'Resume & portfolio',
    description: 'Stand out on paper and online. Recruiters spend seconds scanning — your photo is part of that signal.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Building2,
    label: 'Company team page',
    description: 'Team photos that are visually consistent without the cost of a group photo session.',
    color: 'text-zinc-700',
    bg: 'bg-zinc-100',
  },
  {
    icon: Rocket,
    label: 'Founder & investor profiles',
    description: 'Boards, Crunchbase, press kits, and pitch decks. A confident, clean headshot builds trust before the pitch.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Mic,
    label: 'Speaker & conference bio',
    description: 'Event organizers need your photo in multiple formats. Get all of them in one place.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Users,
    label: 'Enterprise team packs',
    description: 'Consistent style for your whole org. New hires get matched to existing team photo style automatically.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
]

export function UseCasesSection() {
  return (
    <section className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Use cases
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">
            One shoot. Every professional context.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            Export in the exact format each platform or use case requires — no cropping or resizing manually.
          </p>
        </AnimateIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map(({ icon: Icon, label, description, color, bg }, i) => (
            <AnimateIn key={label} delay={i * 0.06}>
              <div className="group flex flex-col gap-4 rounded-2xl border border-border p-6 transition-shadow hover:shadow-premium">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
                <div>
                  <h3 className="mb-1.5 text-sm font-semibold">{label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
