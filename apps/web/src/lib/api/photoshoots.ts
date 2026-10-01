import type { PhotoshootJob, UploadedReferenceImage } from '@trueshot/types'
import type { ApiResponse, JobStatusResponse, PaginatedResponse, PresignedUploadUrl, UploadCompleteRequest } from '@trueshot/types'
import { apiClient } from './client'

export const photoshootsApi = {
  list(): Promise<PaginatedResponse<PhotoshootJob>> {
    return apiClient.get('/photoshoots').then((r) => r.data)
  },

  get(id: string): Promise<PhotoshootJob> {
    return apiClient.get(`/photoshoots/${id}`).then((r) => r.data.data)
  },

  create(stylePackIds: string[], title?: string): Promise<PhotoshootJob> {
    return apiClient.post('/photoshoots', { style_pack_ids: stylePackIds, title }).then((r) => r.data.data)
  },

  getStatus(id: string): Promise<JobStatusResponse> {
    return apiClient.get(`/photoshoots/${id}/status`).then((r) => r.data.data)
  },

  getGenerationProgress(id: string) {
    return apiClient.get(`/photoshoots/${id}/generation-progress`)
  },

  validate(id: string) {
    return apiClient.post(`/photoshoots/${id}/validate`)
  },

  cancel(id: string): Promise<void> {
    return apiClient.post(`/photoshoots/${id}/cancel`).then(() => undefined)
  },
}

export const uploadsApi = {
  getPresignedUrl(photoshootId: string, fileName: string, mimeType: string): Promise<PresignedUploadUrl> {
    return apiClient
      .post('/uploads/presign', { photoshoot_id: photoshootId, file_name: fileName, mime_type: mimeType })
      .then((r) => r.data.data)
  },

  confirmUpload(photoshootId: string, payload: UploadCompleteRequest): Promise<UploadedReferenceImage> {
    return apiClient
      .post(`/uploads/confirm`, { photoshoot_id: photoshootId, ...payload })
      .then((r) => r.data.data)
  },

  validate(photoshootId: string): Promise<ApiResponse<{ passed: boolean; feedback: string[] }>> {
    return apiClient.post(`/photoshoots/${photoshootId}/validate`).then((r) => r.data)
  },

  getReferenceImages(photoshootId: string): Promise<UploadedReferenceImage[]> {
    return apiClient.get(`/photoshoots/${photoshootId}/uploads`).then((r) => r.data.data)
  },

  deleteUpload(uploadId: string): Promise<void> {
    return apiClient.delete(`/uploads/${uploadId}`).then(() => undefined)
  },
}
