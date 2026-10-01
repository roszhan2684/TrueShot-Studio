// Standard API response envelope used by all FastAPI routes
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export interface ApiError {
  detail: string
  code?: string
  field?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Upload
export interface PresignedUploadUrl {
  uploadUrl: string
  storageKey: string
  fields: Record<string, string>
  expiresAt: string
}

export interface UploadCompleteRequest {
  storageKey: string
  fileName: string
  fileSize: number
  mimeType: string
}

// Job status polling
export interface JobStatusResponse {
  jobId: string
  status: string
  progress: number         // 0–100
  currentStep: string | null
  estimatedSecondsRemaining: number | null
  completedAt: string | null
  errorMessage: string | null
}

// Audit
export interface AuditEvent {
  id: string
  userId: string
  workspaceId: string | null
  action: AuditAction
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export type AuditAction =
  | 'upload.created'
  | 'upload.deleted'
  | 'photoshoot.created'
  | 'photoshoot.cancelled'
  | 'photoshoot.completed'
  | 'headshot.favorited'
  | 'headshot.deleted'
  | 'edit.created'
  | 'edit.completed'
  | 'export.created'
  | 'export.downloaded'
  | 'data.deleted_all'
  | 'billing.subscribed'
  | 'billing.cancelled'
  | 'auth.login'
  | 'auth.logout'
