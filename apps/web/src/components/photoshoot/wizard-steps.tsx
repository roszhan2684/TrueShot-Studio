import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

export type WizardStep = 'styles' | 'upload' | 'confirm'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'styles', label: 'Choose styles' },
  { id: 'upload', label: 'Upload photos' },
  { id: 'confirm', label: 'Review & start' },
]

const ORDER: WizardStep[] = ['styles', 'upload', 'confirm']

export function WizardStepper({ current }: { current: WizardStep }) {
  const currentIdx = ORDER.indexOf(current)

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx
        const active = i === currentIdx

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  done
                    ? 'border-brand-900 bg-brand-900 text-white'
                    : active
                    ? 'border-brand-900 bg-background text-brand-900'
                    : 'border-border bg-background text-muted-foreground'
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  'text-sm transition-colors',
                  active ? 'font-medium text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('mx-4 h-px w-12 transition-colors', done ? 'bg-brand-900' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
