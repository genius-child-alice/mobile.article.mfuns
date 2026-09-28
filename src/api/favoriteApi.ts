import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface FavoriteListItem {
  id: number
  name?: string
  desc?: string
  status?: number
  is_favorite?: boolean
  updated_at?: number
  loading?: boolean
}

export function fetchIsFavorite(
  resourceId: number,
  resourceType: number,
  token: string,
): Promise<MfunsApiEnvelope<{ is_favorite?: boolean; count?: number }>> {
  return mfunsGet('/favorite/is_favorite', { resource_id: resourceId, resource_type: resourceType }, token)
}

export function fetchFavoriteListForResource(
  userId: number,
  resourceId: number,
  resourceType: number,
  token: string,
): Promise<MfunsApiEnvelope<{ list?: FavoriteListItem[] }>> {
  return mfunsGet(
    '/favorite/get_favorite_list',
    { user_id: userId, resource_id: resourceId, resource_type: resourceType },
    token,
  )
}

export function addFavorite(
  listId: number,
  resourceId: number,
  resourceType: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost(
    '/favorite/add_favorite',
    { list_id: listId, resource_id: resourceId, type: resourceType },
    token,
  )
}

export function removeFavoriteByResource(
  resourceId: number,
  listId: number,
  resourceType: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost(
    '/favorite/remove_favorite_by_resource',
    { resource_id: resourceId, list_id: listId, type: resourceType },
    token,
  )
}
