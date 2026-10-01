import { apiClient } from './client'

export const privacyApi = {
  getSettings() {
    return apiClient.get('/privacy/settings').then((r) => r.data.data)
  },

  requestDeletion() {
    return apiClient.delete('/privacy/data').then((r) => r.data.data)
  },

  getAuditLog(page = 1) {
    return apiClient.get('/privacy/audit-log', { params: { page } }).then((r) => r.data)
  },
}
