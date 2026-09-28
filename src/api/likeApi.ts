import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'
import type { FeedLikeStatus } from './feedsApi'

/** 0=文章 1=视频 3=动态 4=评论 */
export type MfunsLikeResourceType = 0 | 1 | 3 | 4

export interface LikeStatusData {
  status?: FeedLikeStatus
}

export function likeResource(
  id: number,
  type: MfunsLikeResourceType,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/like/like', { id, type }, token)
}

export function dislikeResource(
  id: number,
  type: MfunsLikeResourceType,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/like/dislike', { id, type }, token)
}

export function cancelLikeResource(
  id: number,
  type: MfunsLikeResourceType,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/like/cancel', { id, type }, token)
}

export function fetchLikeStatus(
  id: number,
  type: MfunsLikeResourceType,
  token: string,
): Promise<MfunsApiEnvelope<LikeStatusData>> {
  return mfunsGet<LikeStatusData>('/like/status', { id, type }, token)
}
