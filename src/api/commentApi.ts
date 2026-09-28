import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'
import type { FeedLikeStatus, FeedUser } from './feedsApi'

export interface CommentAreaInfo {
  id?: number
  resource_id?: number
  resource_type?: number
  user_id?: number
  floor_num?: number
  floor_count?: number
  pin_floor_id?: number
  page_count?: number
  has_hot_comments?: boolean
}

export interface CommentContentExt {
  images?: string[]
}

export interface CommentItem {
  id: number
  comment_area_id?: number
  user_id?: number
  floor_num?: number
  content?: string
  content_type?: number
  content_ext?: CommentContentExt | null
  like_count?: number
  is_second_reply?: boolean
  reply_count?: number
  is_delete?: boolean
  created_at?: number
  user_info?: FeedUser
  second_reply?: CommentItem[]
  like_status?: FeedLikeStatus
}

export function fetchCommentAreaInfo(
  areaId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<CommentAreaInfo>> {
  return mfunsGet<CommentAreaInfo>('/comment/area_info', { area_id: areaId }, token)
}

export function fetchCommentList(
  areaId: number,
  page = 1,
  order: 'desc' | 'asc' = 'desc',
  token?: string | null,
): Promise<MfunsApiEnvelope<CommentItem[]>> {
  return mfunsGet<CommentItem[]>(
    '/comment/list',
    { area_id: areaId, page, order, html: 1 },
    token,
  )
}

export function createComment(
  areaId: number,
  content: string,
  images: string[],
  token: string,
): Promise<MfunsApiEnvelope<CommentItem>> {
  return mfunsPost<CommentItem>(
    '/comment/create',
    { area_id: areaId, content, images: JSON.stringify(images), html: 1 },
    token,
  )
}

export function fetchCommentReplyList(
  commentId: number,
  page = 1,
  token?: string | null,
): Promise<MfunsApiEnvelope<CommentItem[]>> {
  return mfunsGet<CommentItem[]>(
    '/comment/reply_list',
    { comment_id: commentId, page, html: 1 },
    token,
  )
}

export function createCommentReply(
  commentId: number,
  content: string,
  token: string,
): Promise<MfunsApiEnvelope<CommentItem>> {
  return mfunsPost<CommentItem>('/comment/create_reply', { comment_id: commentId, content }, token)
}

export function fetchCommentById(
  id: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<{ comment?: CommentItem }>> {
  return mfunsGet<{ comment?: CommentItem }>('/comment/get', { id, html: 1 }, token)
}

export function deleteComment(
  commentId: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/comment/delete', { comment_id: commentId }, token)
}

export function pinComment(
  id: number,
  token: string,
  cancel = false,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/comment/pin', cancel ? { id, cancel: 1 } : { id }, token)
}
