export interface PhotoshootJob {
  id: string
  userId: string
  workspaceId: string | null
  title: string | null
  status: PhotoshootStatus
  stylePackIds: string[]
  referenceImageCount: number
  generatedCount: number
  qualityPassCount: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PhotoshootStatus =
  | 'draft'
  | 'uploading'
  | 'validating'
  | 'queued'
  | 'generating'
  | 'evaluating'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface UploadedReferenceImage {
  id: string
  photoshootId: string
  storageKey: string
  fileName: string
  fileSize: number
  mimeType: string
  qualitySignals: ImageQualitySignals | null
  isRejected: boolean
  rejectionReason: string | null
  uploadedAt: string
}

export interface ImageQualitySignals {
  faceDetected: boolean
  faceCentered: boolean
  blurScore: number        // 0–1, higher = sharper
  lightingScore: number    // 0–1
  occlusionScore: number   // 0–1, higher = less occlusion
  angle: FaceAngle
  expressionLabel: string
  hasGlasses: boolean
  hasHat: boolean
  overallScore: number     // weighted composite 0–1
}

export type FaceAngle = 'frontal' | 'slight_turn' | 'profile' | 'unknown'

export interface StylePack {
  id: string
  name: string
  slug: string
  description: string
  previewUrl: string
  isPremium: boolean
  outputCount: number
}

export const STYLE_PACKS: StylePack[] = [
  {
    id: 'corporate-studio',
    name: 'Corporate Studio',
    slug: 'corporate-studio',
    description: 'Clean white/grey studio background. Sharp, professional.',
    previewUrl: '/images/styles/corporate-studio.jpg',
    isPremium: false,
    outputCount: 4,
  },
  {
    id: 'linkedin-modern',
    name: 'LinkedIn Modern',
    slug: 'linkedin-modern',
    description: 'Soft neutral backgrounds optimized for profile photos.',
    previewUrl: '/images/styles/linkedin-modern.jpg',
    isPremium: false,
    outputCount: 4,
  },
  {
    id: 'founder-casual',
    name: 'Founder / Startup',
    slug: 'founder-casual',
    description: 'Approachable premium look. Casual-confident for startup profiles.',
    previewUrl: '/images/styles/founder-casual.jpg',
    isPremium: true,
    outputCount: 4,
  },
  {
    id: 'executive-dark',
    name: 'Executive Dark',
    slug: 'executive-dark',
    description: 'Dark high-contrast backgrounds for senior executive positioning.',
    previewUrl: '/images/styles/executive-dark.jpg',
    isPremium: true,
    outputCount: 4,
  },
  {
    id: 'creative-pro',
    name: 'Creative Professional',
    slug: 'creative-pro',
    description: 'Textured, warm backgrounds for designers, writers, and creators.',
    previewUrl: '/images/styles/creative-pro.jpg',
    isPremium: true,
    outputCount: 4,
  },
  {
    id: 'team-page',
    name: 'Team Page Brand Pack',
    slug: 'team-page',
    description: 'Consistent style for entire team pages. Aligned lighting and tone.',
    previewUrl: '/images/styles/team-page.jpg',
    isPremium: true,
    outputCount: 6,
  },
]
