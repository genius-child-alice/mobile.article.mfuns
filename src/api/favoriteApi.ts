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

/** 收藏夹内单条内容（结构对齐 ContentBar / 历史 resource） */
export interface FavoriteContentItem {
  id?: number
  favorite_id?: number
  /** 资源类型：0=文章 */
  type?: number
  resource_type?: number
  title?: string
  cover?: string
  summary?: string
  user?: { name?: string }
  like_count?: number
  comment_count?: number
  view_count?: number
  duration?: number
  tag?: string[]
  resource_info?: {
    id?: number
    type?: number
    title?: string
    cover?: string
    summary?: string
    user?: { name?: string }
    like_count?: number
    comment_count?: number
    view_count?: number
    duration?: number
    tag?: string[]
  }
}

export function fetchFavoriteItems(
  favoriteId: number,
  lastId = 0,
  token?: string | null,
): Promise<MfunsApiEnvelope<{ list?: FavoriteContentItem[] }>> {
  return mfunsGet(
    '/favorite/get_favorite_item',
    { favorite_id: favoriteId, last_id: lastId > 0 ? lastId : undefined },
    token,
  )
}

export function removeFavoriteItem(
  itemId: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/favorite/remove_favorite', { item_id: itemId }, token)
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
