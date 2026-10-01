import { AnimateIn } from '../animate-in'

const STEPS = [
  {
    number: '01',
    title: 'Upload 8–15 reference photos',
    body: 'TrueShot analyzes each photo for face detection, sharpness, lighting, and angle diversity. You get real feedback before generation starts — not after.',
    detail: 'Blur detection · Occlusion check · Angle diversity score · Lighting quality',
  },
  {
    number: '02',
    title: 'Build your identity profile',
    body: 'Your face embeddings are derived from the reference set and used to anchor every output. This is what makes results look like you.',
    detail: 'Face embeddings · Identity vector · Secure backend storage',
  },
  {
    number: '03',
    title: 'Generate across style packs',
    body: 'Run controlled generation batches across the styles you selected. Multiple outputs per pack — ranked by quality before you see them.',
    detail: 'Corporate · LinkedIn · Executive · Founder · Creative · Team Page',
  },
  {
    number: '04',
    title: 'Quality evaluation, automatically',
    body: 'Every output is scored for identity similarity, sharpness, natural eyes, skin texture, and composition. Weak results are rejected before they reach your gallery.',
    detail: 'Identity similarity · Face quality · Artifact detection · Ranking',
  },
  {
    number: '05',
    title: 'Edit precisely',
    body: 'Swap the background, adjust skin retouch intensity, change outfit color, or tweak lighting — without rerunning generation. Identity stays stable.',
    detail: '14 edit types · Non-destructive · History preserved',
  },
  {
    number: '06',
    title: 'Export ready',
    body: 'One-click exports in 8 professional formats: LinkedIn, team page, press kit 4K, transparent PNG, email signature, and more.',
    detail: '8 formats · Presigned download URLs · No watermarks',
  },
]

export function WorkflowSection() {
  return (
    <section className="border-t border-border bg-muted/20 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <h2 className="text-4xl font-semibold tracking-tight">Six steps. Under 15 minutes.</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
            A structured pipeline — not a black box. You see what happens at every stage.
          </p>
        </AnimateIn>

        <div className="relative grid gap-0 md:grid-cols-2">
          {/* Vertical connector line on desktop */}
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-border md:block" />

          {STEPS.map((step, i) => (
            <AnimateIn
              key={step.number}
              delay={i * 0.07}
              className={`relative flex flex-col gap-3 p-8 ${
                i % 2 === 0 ? 'md:pr-16 md:text-right md:items-end' : 'md:pl-16'
              }`}
            >
              {/* Step number dot — centered on the divider */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold shadow-sm ${
                  i % 2 === 0 ? 'md:-mr-[54px]' : 'md:-ml-[54px]'
                }`}
              >
                {step.number}
              </div>

              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              <p className="text-[11px] font-medium text-muted-foreground/60">{step.detail}</p>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
