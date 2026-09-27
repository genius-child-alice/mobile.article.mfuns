import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface FeedLikeSide {
  count?: number
  is_active?: boolean
}

export interface FeedLikeStatus {
  like?: FeedLikeSide
  dislike?: FeedLikeSide
}

export interface FeedUser {
  id: number
  name?: string
  name_color?: string
  avatar?: string
  badges?: number[]
  info?: string
  fans?: number
}

export interface FeedItem {
  id: number
  user_id?: number
  content?: string
  created_at?: number
  updated_at?: number
  views?: number
  floor_count?: number
  resource_type?: number
  resource_id?: number
  user?: FeedUser
  like_status?: FeedLikeStatus
  tags?: string[]
  extra?: {
    images?: string[]
    view_type?: string
  }
}

export interface FeedFollowUserEntry {
  id?: number
  user_id?: number
  name?: string
  avatar?: string
  user?: FeedUser
}

export interface FeedFollowUserListData {
  list?: FeedFollowUserEntry[]
}

export function fetchFeedList(
  startId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<FeedItem[]>> {
  return mfunsGet<FeedItem[]>(
    '/feeds/list',
    { start_id: startId > 0 ? startId : undefined, html: 1 },
    token,
  )
}

export function fetchFeedNewReplyList(
  page: number,
  size = 20,
  token?: string | null,
): Promise<MfunsApiEnvelope<FeedItem[]>> {
  return mfunsGet<FeedItem[]>(
    '/feeds/new_reply_list',
    { page, size, html: 1 },
    token,
  )
}

export function fetchFeedUserList(
  startId: number,
  userId: number,
  follow: 0 | 1,
  token?: string | null,
): Promise<MfunsApiEnvelope<FeedItem[]>> {
  return mfunsGet<FeedItem[]>(
    '/feeds/list',
    {
      start_id: startId > 0 ? startId : undefined,
      user_id: userId,
      follow,
      html: 1,
    },
    token,
  )
}

export function fetchFeedFollowUsers(
  token: string,
): Promise<MfunsApiEnvelope<FeedFollowUserListData>> {
  return mfunsGet<FeedFollowUserListData>('/feeds/user', undefined, token)
}
