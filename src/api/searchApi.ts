import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'
import type { HomeContentItem } from './homeApi'
import type { MemberUserInfo } from './memberUserApi'

export interface SearchUserItem extends MemberUserInfo {
  info?: string
  /** 关注状态：0 未关注 / 1 已关注 / 2 互关 */
  status?: number
}

export interface SearchUserData {
  list?: SearchUserItem[]
}

export interface SearchResourceData {
  list?: HomeContentItem[]
}

/** -1 综合 / 0 文章 / 1 视频 */
export type SearchResourceType = -1 | 0 | 1

/** 参考站 search.user → GET /search/user */
export function searchUsers(
  user: string,
  page: number,
  token?: string | null,
  size = 20,
): Promise<MfunsApiEnvelope<SearchUserData>> {
  return mfunsGet<SearchUserData>('/search/user', { user, page, size }, token)
}

/** 参考站 search.resource → GET /search/resource */
export function searchResource(
  text: string,
  page: number,
  type: SearchResourceType,
  size = 20,
  sort = 'all',
  token?: string | null,
): Promise<MfunsApiEnvelope<SearchResourceData>> {
  return mfunsGet<SearchResourceData>(
    '/search/resource',
    { text, size, page, sort, type },
    token,
  )
}
