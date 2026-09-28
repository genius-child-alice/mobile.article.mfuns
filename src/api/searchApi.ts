import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'
import type { MemberUserInfo } from './memberUserApi'

export interface SearchUserData {
  list?: MemberUserInfo[]
}

/** 参考站 search.user → GET /search/user */
export function searchUsers(
  user: string,
  page: number,
  token: string,
  size = 20,
): Promise<MfunsApiEnvelope<SearchUserData>> {
  return mfunsGet<SearchUserData>('/search/user', { user, page, size }, token)
}
