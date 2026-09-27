import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface MemberFollowStats {
  fans?: number
  follow?: number
}

export interface MemberUserInfo {
  id: number
  name?: string
  avatar?: string
  name_color?: string
  neko_coin?: number
  exp?: number
  level_id?: number
  bio?: string
  /** 0 保密 1 男 2 女 3 其他 */
  gender?: number
  /** Unix 秒 */
  created_at?: number
  free_name_change_available?: boolean
  change_name_card_count?: number
  follow?: MemberFollowStats
  /** Worn badge ids (reference: member_auth.wearBadges). */
  badges?: number[]
}

export interface MemberUserInfoData {
  user: MemberUserInfo
}

export interface MemberHistoryResource {
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
  cover_meta?: { blurhash?: string }
}

export interface MemberHistoryItem {
  id: number
  resource_info?: MemberHistoryResource
  time?: number
}

export interface MemberLevelSection {
  level_id: number
  experience: number
}

export function fetchMemberUserInfo(
  token: string,
): Promise<MfunsApiEnvelope<MemberUserInfoData>> {
  return mfunsGet<MemberUserInfoData>('/user/info', undefined, token)
}

export const MFUNS_ARTICLE_RESOURCE_TYPE = 0

export function fetchMemberHistory(
  token: string,
  startTime = 0,
  /** 0 = 文章（参考 m.mfuns ArticleHistory / history.get） */
  resourceType?: number,
): Promise<MfunsApiEnvelope<MemberHistoryItem[]>> {
  const params: Record<string, string | number | undefined> = { start_time: startTime }
  if (resourceType !== undefined) {
    params.resource_type = resourceType
  }
  return mfunsGet<MemberHistoryItem[]>('/history/get', params, token)
}

export function clearMemberHistory(token: string): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsGet('/history/clean', undefined, token)
}

export function fetchMemberLevelSection(
  token: string,
): Promise<MfunsApiEnvelope<MemberLevelSection[]>> {
  return mfunsGet<MemberLevelSection[]>('/user/level_section', undefined, token)
}

export function updateMemberAvatar(
  token: string,
  avatar: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/user/set_avatar', { avatar }, token)
}

export function updateMemberName(
  token: string,
  name: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/user/set_name', { name }, token)
}

export function updateMemberGender(
  token: string,
  gender: number,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/user/set_gender', { gender }, token)
}

export function updateMemberBio(
  token: string,
  bio: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/user/set_bio', { bio }, token)
}
