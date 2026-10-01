import type { GeneratedHeadshot } from '@trueshot/types'
import type { PaginatedResponse } from '@trueshot/types'
import { apiClient } from './client'

export const headshotsApi = {
  list(photoshootId: string): Promise<PaginatedResponse<GeneratedHeadshot>> {
    return apiClient.get(`/headshots`, { params: { photoshoot_id: photoshootId } }).then((r) => r.data)
  },

  get(id: string): Promise<GeneratedHeadshot> {
    return apiClient.get(`/headshots/${id}`).then((r) => r.data.data)
  },

  favorite(id: string, isFavorited: boolean): Promise<GeneratedHeadshot> {
    return apiClient.patch(`/headshots/${id}/favorite`, { is_favorited: isFavorited }).then((r) => r.data.data)
  },

  getImageUrl(storageKey: string): Promise<string> {
    return apiClient.get(`/headshots/url`, { params: { key: storageKey } }).then((r) => r.data.data.url)
  },
}
