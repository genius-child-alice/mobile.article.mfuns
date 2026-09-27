import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface MfunsBadgeInfo {
  name?: string
  svg?: string
}

export function fetchUserBadge(
  badgeId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<MfunsBadgeInfo>> {
  return mfunsGet<MfunsBadgeInfo>('/user/badge', { id: badgeId }, token)
}
