'use client'

import {
  ImageIcon,
  Sparkles,
  Scissors,
  Lightbulb,
  User,
  Wind,
  Smile,
  Sun,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditType } from '@trueshot/types'

interface EditGroup {
  label: string
  icon: React.ElementType
  types: { type: EditType; label: string }[]
}

const EDIT_GROUPS: EditGroup[] = [
  {
    label: 'Background',
    icon: ImageIcon,
    types: [
      { type: 'background_swap', label: 'Swap background' },
      { type: 'background_blur', label: 'Blur background' },
    ],
  },
  {
    label: 'Lighting',
    icon: Sun,
    types: [{ type: 'relight', label: 'Relight' }],
  },
  {
    label: 'Crop',
    icon: Scissors,
    types: [{ type: 'crop_reframe', label: 'Crop & reframe' }],
  },
  {
    label: 'Retouching',
    icon: Sparkles,
    types: [
      { type: 'skin_retouch', label: 'Skin retouch' },
      { type: 'blemish_cleanup', label: 'Blemish cleanup' },
      { type: 'undereye_reduction', label: 'Under-eye' },
    ],
  },
  {
    label: 'Expression',
    icon: Smile,
    types: [{ type: 'smile_adjust', label: 'Smile adjust' }],
  },
  {
    label: 'Hair & Beard',
    icon: Wind,
    types: [
      { type: 'hair_cleanup', label: 'Hair cleanup' },
      { type: 'flyaway_removal', label: 'Flyaway removal' },
      { type: 'beard_cleanup', label: 'Beard cleanup' },
    ],
  },
  {
    label: 'Outfit',
    icon: User,
    types: [
      { type: 'outfit_color', label: 'Outfit color' },
      { type: 'outfit_style', label: 'Outfit style' },
    ],
  },
  {
    label: 'Glasses',
    icon: Lightbulb,
    types: [
      { type: 'glasses_remove', label: 'Remove glasses' },
      { type: 'glasses_keep', label: 'Keep glasses' },
    ],
  },
]

interface EditTypePanelProps {
  activeType: EditType | null
  onSelect: (type: EditType) => void
}

export function EditTypePanel({ activeType, onSelect }: EditTypePanelProps) {
  return (
    <div className="space-y-4 p-4">
      {EDIT_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <group.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
          </div>
          <div className="space-y-0.5">
            {group.types.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => onSelect(type)}
                className={cn(
                  'flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  activeType === type
                    ? 'bg-brand-700/10 font-medium text-brand-700'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
