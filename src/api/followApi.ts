import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface FollowStatusData {
  /** 0=未关注 1=已关注 2=已互关（参考站 FollowBtn） */
  status?: number
  is_follow?: boolean
  /** 部分接口用 follow / is_following */
  follow?: boolean
  is_following?: boolean
}

export function followUser(
  userId: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/follow/follow', { user_id: userId }, token)
}

export function unfollowUser(
  userId: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/follow/follow', { user_id: userId, unfollow: 1 }, token)
}

export function fetchFollowStatus(
  userId: number,
  token: string,
): Promise<MfunsApiEnvelope<FollowStatusData>> {
  return mfunsGet<FollowStatusData>('/follow/status', { user_id: userId }, token)
}

export function isFollowActive(data?: FollowStatusData | null): boolean {
  if (!data) return false
  return Boolean(data.is_follow ?? data.follow ?? data.is_following)
}
