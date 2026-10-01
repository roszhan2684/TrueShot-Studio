export interface EditJob {
  id: string
  headshotId: string
  userId: string
  status: EditJobStatus
  editType: EditType
  parameters: EditParameters
  resultStorageKey: string | null
  resultThumbnailKey: string | null
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export type EditJobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export type EditType =
  | 'background_swap'
  | 'background_blur'
  | 'outfit_color'
  | 'outfit_style'
  | 'hair_cleanup'
  | 'beard_cleanup'
  | 'flyaway_removal'
  | 'skin_retouch'
  | 'glasses_remove'
  | 'glasses_keep'
  | 'smile_adjust'
  | 'crop_reframe'
  | 'relight'
  | 'blemish_cleanup'
  | 'undereye_reduction'

export interface EditParameters {
  // Background
  backgroundPreset?: BackgroundPreset
  backgroundBlurIntensity?: number     // 0–100
  backgroundCustomColor?: string       // hex

  // Outfit
  outfitColor?: string                 // hex or color name
  outfitStyle?: OutfitStyle

  // Skin / Face
  retouchIntensity?: number            // 0–100, default 30 (subtle)
  smileIntensity?: number              // -50 to +50
  blemishCleanupLevel?: 'light' | 'moderate' | 'strong'
  undereyeReductionLevel?: 'light' | 'moderate' | 'strong'

  // Hair
  hairCleanupLevel?: 'light' | 'moderate' | 'strong'
  beardCleanupLevel?: 'light' | 'moderate' | 'strong'

  // Lighting
  relightPreset?: RelightPreset

  // Crop
  cropAspectRatio?: string             // e.g. '1:1', '4:5', '16:9'
  cropFocusPoint?: { x: number; y: number }
}

export type BackgroundPreset =
  | 'white_studio'
  | 'light_grey'
  | 'dark_grey'
  | 'charcoal'
  | 'warm_beige'
  | 'soft_blur_office'
  | 'outdoor_soft'
  | 'custom_color'
  | 'transparent'

export type OutfitStyle = 'business_formal' | 'business_casual' | 'smart_casual' | 'unchanged'

export type RelightPreset =
  | 'natural_window'
  | 'studio_soft_box'
  | 'dramatic_side'
  | 'warm_golden'
  | 'cool_daylight'
  | 'unchanged'
