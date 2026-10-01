import type { ExportAsset, ExportFormat } from '@trueshot/types'
import { apiClient } from './client'

export const exportsApi = {
  create(headshotId: string, format: ExportFormat, editJobId?: string): Promise<ExportAsset> {
    return apiClient
      .post('/exports', { headshot_id: headshotId, format, edit_job_id: editJobId })
      .then((r) => r.data.data)
  },

  list(headshotId: string): Promise<ExportAsset[]> {
    return apiClient.get('/exports', { params: { headshot_id: headshotId } }).then((r) => r.data.data)
  },

  getDownloadUrl(exportId: string): Promise<string> {
    return apiClient.get(`/exports/${exportId}/download`).then((r) => r.data.data.url)
  },
}
