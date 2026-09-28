import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface MfunsBadgeInfo {
  id?: number
  name?: string
  svg?: string
  description?: string
  /** 1 可佩戴 */
  wearable?: number
}

export interface MemberOwnedBadge {
  badge_id: number
  expire_time?: number
  info?: MfunsBadgeInfo
  /** 前端状态：是否已在佩戴区 */
  wear?: boolean
}

export function fetchUserBadge(
  badgeId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<MfunsBadgeInfo>> {
  return mfunsGet<MfunsBadgeInfo>('/user/badge', { id: badgeId }, token)
}

/** 参考站 user.badges → GET /user/user_badges */
export function fetchUserBadges(
  token: string,
): Promise<MfunsApiEnvelope<MemberOwnedBadge[]>> {
  return mfunsGet<MemberOwnedBadge[]>('/user/user_badges', undefined, token)
}

/** 参考站 user.setBadges → POST /user/set_badge */
export function setUserBadges(
  badgeIds: number[],
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/user/set_badge', { badges: badgeIds }, token)
}
