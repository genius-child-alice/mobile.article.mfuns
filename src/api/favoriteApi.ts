import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface FavoriteListItem {
  id: number
  name?: string
  desc?: string
  status?: number
  count?: number
  is_favorite?: boolean
  updated_at?: number
  loading?: boolean
}

/** 我的收藏夹列表（不带 resource，参考站 getFavoriteList(userId, null, null)） */
export function fetchMyFavoriteLists(
  userId: number,
  token: string,
): Promise<MfunsApiEnvelope<{ list?: FavoriteListItem[] }>> {
  return mfunsGet('/favorite/get_favorite_list', { user_id: userId }, token)
}

export function createFavoriteList(
  name: string,
  desc: string,
  status: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/favorite/create_favorite_list', { name, desc, status }, token)
}

export function updateFavoriteList(
  id: number,
  name: string,
  desc: string,
  status: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/favorite/update_favorite_list', { id, name, desc, status }, token)
}

export function deleteFavoriteList(
  id: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/favorite/delete_favorite_list', { id }, token)
}

export interface FavoriteInfoData {
  favorite?: FavoriteListItem
  user?: {
    id?: number
    name?: string
    avatar?: string
  }
}

export function fetchFavoriteInfo(
  favoriteId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<FavoriteInfoData>> {
  return mfunsGet<FavoriteInfoData>(
    '/favorite/get_favorite_info',
    { favorite_id: favoriteId },
    token,
  )
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
