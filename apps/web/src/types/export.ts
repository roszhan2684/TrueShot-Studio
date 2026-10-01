export interface ExportAsset {
  id: string
  headshotId: string
  editJobId: string | null
  userId: string
  format: ExportFormat
  status: ExportStatus
  storageKey: string | null
  downloadUrl: string | null
  fileSize: number | null
  widthPx: number
  heightPx: number
  expiresAt: string | null
  createdAt: string
}

export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'expired'

export type ExportFormat =
  | 'linkedin_portrait'      // 800×800 JPEG, optimized
  | 'square_avatar'          // 400×400 JPEG/PNG
  | 'team_page_card'         // 600×600 JPEG
  | 'speaker_profile'        // 1200×900 JPEG
  | 'press_kit_4k'           // 3840×2160 max JPEG
  | 'transparent_png'        // original res, transparent bg PNG
  | 'grayscale_pr'           // 1200×1200 grayscale JPEG
  | 'email_signature'        // 300×300 JPEG

export interface ExportSpec {
  format: ExportFormat
  label: string
  description: string
  dimensions: string
  mimeType: string
  icon: string
  isPremium: boolean
}

export const EXPORT_SPECS: ExportSpec[] = [
  {
    format: 'linkedin_portrait',
    label: 'LinkedIn Portrait',
    description: 'Optimized square crop for LinkedIn profile',
    dimensions: '800×800',
    mimeType: 'image/jpeg',
    icon: 'linkedin',
    isPremium: false,
  },
  {
    format: 'square_avatar',
    label: 'Square Avatar',
    description: 'Universal avatar for Slack, GitHub, email',
    dimensions: '400×400',
    mimeType: 'image/jpeg',
    icon: 'user-circle',
    isPremium: false,
  },
  {
    format: 'team_page_card',
    label: 'Team Page Card',
    description: 'Consistent crop for company about pages',
    dimensions: '600×600',
    mimeType: 'image/jpeg',
    icon: 'users',
    isPremium: false,
  },
  {
    format: 'speaker_profile',
    label: 'Speaker Profile',
    description: 'Landscape-compatible speaker bio crop',
    dimensions: '1200×900',
    mimeType: 'image/jpeg',
    icon: 'mic',
    isPremium: true,
  },
  {
    format: 'press_kit_4k',
    label: 'Press Kit 4K',
    description: 'Maximum resolution for media and press',
    dimensions: 'Up to 3840px',
    mimeType: 'image/jpeg',
    icon: 'image',
    isPremium: true,
  },
  {
    format: 'transparent_png',
    label: 'Transparent PNG',
    description: 'No background — place anywhere',
    dimensions: 'Original resolution',
    mimeType: 'image/png',
    icon: 'layers',
    isPremium: true,
  },
  {
    format: 'grayscale_pr',
    label: 'Grayscale PR',
    description: 'High-contrast black and white for press use',
    dimensions: '1200×1200',
    mimeType: 'image/jpeg',
    icon: 'contrast',
    isPremium: true,
  },
  {
    format: 'email_signature',
    label: 'Email Signature',
    description: 'Small optimized crop for email signature blocks',
    dimensions: '300×300',
    mimeType: 'image/jpeg',
    icon: 'mail',
    isPremium: false,
  },
]
