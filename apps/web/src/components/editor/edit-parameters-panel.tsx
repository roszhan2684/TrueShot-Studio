'use client'

import { useEditorStore } from '@/stores/editor.store'
import type { BackgroundPreset, EditType, RelightPreset } from '@trueshot/types'

const BG_PRESETS: { value: BackgroundPreset; label: string; swatch: string }[] = [
  { value: 'white_studio', label: 'White studio', swatch: '#f5f5f5' },
  { value: 'light_grey', label: 'Light grey', swatch: '#d1d5db' },
  { value: 'dark_grey', label: 'Dark grey', swatch: '#6b7280' },
  { value: 'charcoal', label: 'Charcoal', swatch: '#1f2937' },
  { value: 'warm_beige', label: 'Warm beige', swatch: '#d4bfa0' },
  { value: 'soft_blur_office', label: 'Blurred office', swatch: '#c8d8e8' },
  { value: 'outdoor_soft', label: 'Outdoor soft', swatch: '#b8d4b8' },
  { value: 'transparent', label: 'Transparent', swatch: 'transparent' },
]

const RELIGHT_PRESETS: { value: RelightPreset; label: string }[] = [
  { value: 'natural_window', label: 'Natural window' },
  { value: 'studio_soft_box', label: 'Studio soft box' },
  { value: 'dramatic_side', label: 'Dramatic side' },
  { value: 'warm_golden', label: 'Warm golden hour' },
  { value: 'cool_daylight', label: 'Cool daylight' },
]

const INTENSITY_TYPES: EditType[] = [
  'skin_retouch', 'background_blur',
]
const LEVEL_TYPES: EditType[] = [
  'blemish_cleanup', 'undereye_reduction', 'hair_cleanup', 'beard_cleanup', 'flyaway_removal',
]
const CROP_RATIOS = ['1:1', '4:5', '3:4', '16:9', '9:16', '2:3']

export function EditParametersPanel() {
  const { editType, pendingParameters, setPendingParameters } = useEditorStore()

  if (!editType) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-4 text-sm text-muted-foreground">
        Select an edit type to configure
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      {/* Background swap */}
      {editType === 'background_swap' && (
        <Section label="Background preset">
          <div className="grid grid-cols-2 gap-1.5">
            {BG_PRESETS.map(({ value, label, swatch }) => (
              <button
                key={value}
                onClick={() => setPendingParameters({ backgroundPreset: value })}
                className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition-colors ${
                  pendingParameters.backgroundPreset === value
                    ? 'border-brand-700 bg-brand-700/10 text-brand-700'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded border border-border"
                  style={{
                    backgroundColor: swatch === 'transparent' ? undefined : swatch,
                    backgroundImage: swatch === 'transparent'
                      ? 'repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 0 0 / 8px 8px'
                      : undefined,
                  }}
                />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Relight */}
      {editType === 'relight' && (
        <Section label="Lighting preset">
          {RELIGHT_PRESETS.map(({ value, label }) => (
            <OptionRow
              key={value}
              label={label}
              selected={pendingParameters.relightPreset === value}
              onClick={() => setPendingParameters({ relightPreset: value })}
            />
          ))}
        </Section>
      )}

      {/* Crop reframe */}
      {editType === 'crop_reframe' && (
        <Section label="Aspect ratio">
          <div className="flex flex-wrap gap-1.5">
            {CROP_RATIOS.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setPendingParameters({ cropAspectRatio: ratio })}
                className={`rounded-md border px-3 py-1.5 text-xs font-mono transition-colors ${
                  pendingParameters.cropAspectRatio === ratio
                    ? 'border-brand-700 bg-brand-700/10 text-brand-700'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Intensity slider */}
      {INTENSITY_TYPES.includes(editType as EditType) && (
        <Section label={editType === 'background_blur' ? 'Blur intensity' : 'Retouch intensity'}>
          <IntensitySlider
            value={
              editType === 'background_blur'
                ? (pendingParameters.backgroundBlurIntensity ?? 60)
                : (pendingParameters.retouchIntensity ?? 30)
            }
            onChange={(v) =>
              setPendingParameters(
                editType === 'background_blur'
                  ? { backgroundBlurIntensity: v }
                  : { retouchIntensity: v },
              )
            }
          />
        </Section>
      )}

      {/* Three-level options */}
      {LEVEL_TYPES.includes(editType as EditType) && (
        <Section label="Intensity">
          {(['light', 'moderate', 'strong'] as const).map((level) => {
            const key = levelKey(editType)
            return (
              <OptionRow
                key={level}
                label={level.charAt(0).toUpperCase() + level.slice(1)}
                selected={(pendingParameters as Record<string, unknown>)[key] === level}
                onClick={() => setPendingParameters({ [key]: level } as never)}
              />
            )
          })}
        </Section>
      )}

      {/* Smile adjust */}
      {editType === 'smile_adjust' && (
        <Section label="Smile intensity">
          <IntensitySlider
            min={-50}
            max={50}
            value={pendingParameters.smileIntensity ?? 0}
            onChange={(v) => setPendingParameters({ smileIntensity: v })}
            labelLow="Less"
            labelHigh="More"
          />
        </Section>
      )}

      {/* Outfit color */}
      {editType === 'outfit_color' && (
        <Section label="Target color">
          <input
            type="color"
            value={pendingParameters.outfitColor ?? '#1a1a2e'}
            onChange={(e) => setPendingParameters({ outfitColor: e.target.value })}
            className="h-10 w-full cursor-pointer rounded-lg border border-border"
          />
        </Section>
      )}

      {/* No controls needed */}
      {['glasses_remove', 'glasses_keep', 'outfit_style'].includes(editType) && (
        <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
          No additional settings for this edit. Click Apply to proceed.
        </div>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
        selected ? 'border-brand-700 bg-brand-700/10 text-brand-700' : 'border-border hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}

function IntensitySlider({
  value,
  onChange,
  min = 0,
  max = 100,
  labelLow = 'None',
  labelHigh = 'Strong',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  labelLow?: string
  labelHigh?: string
}) {
  return (
    <div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-700"
      />
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{labelLow}</span>
        <span className="font-mono font-semibold text-foreground">{value}</span>
        <span>{labelHigh}</span>
      </div>
    </div>
  )
}

function levelKey(editType: EditType): string {
  return {
    blemish_cleanup: 'blemishCleanupLevel',
    undereye_reduction: 'undereyeReductionLevel',
    hair_cleanup: 'hairCleanupLevel',
    beard_cleanup: 'beardCleanupLevel',
    flyaway_removal: 'hairCleanupLevel',
  }[editType as string] ?? 'retouchIntensity'
}
