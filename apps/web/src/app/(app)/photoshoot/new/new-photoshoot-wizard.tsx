'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { WizardStepper, type WizardStep } from '@/components/photoshoot/wizard-steps'
import { StylePackSelector } from '@/components/photoshoot/style-pack-selector'
import { UploadCoach } from '@/components/photoshoot/upload-coach'
import { ConfirmLaunch } from '@/components/photoshoot/confirm-launch'
import { usePhotoshootStore } from '@/stores/photoshoot.store'
import { useCreatePhotoshoot } from '@/hooks/use-photoshoot'
import { MIN_REFERENCE_IMAGES } from '@/lib/constants'

const STEPS: WizardStep[] = ['styles', 'upload', 'confirm']

const STEP_VARIANT = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir < 0 ? 40 : -40 }),
}

export function NewPhotoshootWizard() {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [photoshootId, setPhotoshootId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { selectedStylePacks, uploadItems, resetWizard } = usePhotoshootStore()
  const createMutation = useCreatePhotoshoot()

  const currentStep = STEPS[stepIndex]
  const doneCount = uploadItems.filter((i) => i.status === 'done').length

  function canProceed(): boolean {
    if (currentStep === 'styles') return selectedStylePacks.length > 0
    if (currentStep === 'upload') return doneCount >= MIN_REFERENCE_IMAGES
    return true
  }

  async function handleNext() {
    if (!canProceed()) return

    // Create photoshoot job when advancing from styles → upload
    if (currentStep === 'styles' && !photoshootId) {
      setIsCreating(true)
      try {
        const job = await createMutation.mutateAsync({
          stylePackIds: selectedStylePacks.map((p) => p.id),
        })
        setPhotoshootId(job.id)
      } catch {
        toast.error('Failed to create photoshoot. Please try again.')
        setIsCreating(false)
        return
      }
      setIsCreating(false)
    }

    setDirection(1)
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  function handleBack() {
    setDirection(-1)
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  function handleCancel() {
    resetWizard()
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* Wizard header */}
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">New photoshoot</h2>
            <button
              onClick={handleCancel}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <WizardStepper current={currentStep} />
        </div>
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={STEP_VARIANT}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {currentStep === 'styles' && <StylePackSelector />}
                {currentStep === 'upload' && photoshootId && <UploadCoach photoshootId={photoshootId} />}
                {currentStep === 'confirm' && photoshootId && <ConfirmLaunch photoshootId={photoshootId} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom nav bar (hidden on confirm step — confirm has its own CTA) */}
        {currentStep !== 'confirm' && (
          <div className="border-t border-border bg-background px-6 py-4">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <button
                onClick={handleBack}
                disabled={stepIndex === 0}
                className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {/* Step dots */}
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      i === stepIndex ? 'bg-brand-900' : 'bg-border'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!canProceed() || isCreating}
                className="flex items-center gap-1.5 rounded-lg bg-brand-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
