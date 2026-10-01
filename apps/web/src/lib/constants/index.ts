export const APP_NAME = 'TrueShot Studio'
export const APP_TAGLINE = 'Looks like you, not an AI version of you.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const NAV_MARKETING = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Examples', href: '/examples' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Teams', href: '/teams' },
] as const

export const NAV_APP = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'My Photoshoots', href: '/photoshoot', icon: 'camera' },
  { label: 'Billing', href: '/billing', icon: 'credit-card' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
] as const

export const POLLING_INTERVAL_MS = 3000

export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024  // 20 MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MIN_REFERENCE_IMAGES = 8
export const MAX_REFERENCE_IMAGES = 15
