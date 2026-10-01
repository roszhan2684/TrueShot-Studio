import type { EditJob, EditParameters, EditType } from '@trueshot/types'
import { apiClient } from './client'

export const editorApi = {
  createEditJob(headshotId: string, editType: EditType, parameters: EditParameters): Promise<EditJob> {
    return apiClient
      .post('/editor/jobs', { headshot_id: headshotId, edit_type: editType, parameters })
      .then((r) => r.data.data)
  },

  getEditJob(jobId: string): Promise<EditJob> {
    return apiClient.get(`/editor/jobs/${jobId}`).then((r) => r.data.data)
  },

  listEditJobs(headshotId: string): Promise<EditJob[]> {
    return apiClient.get('/editor/jobs', { params: { headshot_id: headshotId } }).then((r) => r.data.data)
  },
}
