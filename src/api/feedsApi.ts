import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

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
  level_id?: number
  badges?: number[]
  info?: string
  fans?: number
}

export interface FeedExtra {
  images?: string[]
  view_type?: string
  title?: string
  cover?: string
  content?: string
  id?: number
  resource_id?: number
  resource_type?: number
  user?: FeedUser
  [key: string]: unknown
}

export interface FeedItem {
  id: number
  user_id?: number
  content?: string
  content_type?: number
  created_at?: number
  updated_at?: number
  views?: number
  floor_count?: number
  comment_area_id?: number
  resource_type?: number
  resource_id?: number
  device?: string
  device_type?: number
  extra_type?: number
  user?: FeedUser
  like_status?: FeedLikeStatus
  tags?: string[]
  extra?: FeedExtra
}

export interface FeedFollowUserEntry {
  id?: number
  user_id?: number
  name?: string
  avatar?: string
  info?: string
  level_id?: number
  badges?: number[]
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

export function fetchFeedGet(
  id: number | string,
  token?: string | null,
): Promise<MfunsApiEnvelope<FeedItem>> {
  return mfunsGet<FeedItem>('/feeds/get', { id, html: 1 }, token)
}

export function deleteFeed(
  id: number | string,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/feeds/delete', { id }, token)
}
