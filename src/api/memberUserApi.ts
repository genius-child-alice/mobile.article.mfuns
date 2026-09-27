import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

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
  user?: { name?: string }
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

export function fetchMemberHistory(
  token: string,
  startTime = 0,
): Promise<MfunsApiEnvelope<MemberHistoryItem[]>> {
  return mfunsGet<MemberHistoryItem[]>('/history/get', { start_time: startTime }, token)
}

export function fetchMemberLevelSection(
  token: string,
): Promise<MfunsApiEnvelope<MemberLevelSection[]>> {
  return mfunsGet<MemberLevelSection[]>('/user/level_section', undefined, token)
}
