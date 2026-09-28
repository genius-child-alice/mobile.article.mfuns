import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'
import type { FeedLikeStatus, FeedUser } from './feedsApi'

export interface ArticleCategory {
  id?: number
  name?: string
  parent_category?: { id?: number; name?: string }
}

export interface ArticleDetail {
  id: number
  title?: string
  cover?: string
  content?: string
  content_type?: number
  copyright?: number
  created_at?: number
  published_at?: number
  is_show_cover?: boolean
  comment_area_id?: number
  series_id?: number
  series_order?: string
  user_id?: number
  device_type?: number
}

export interface ArticleSeriesItem {
  resource_id?: number
  resource_type?: number
  title?: string
  cover?: string
  like_count?: number
  view_count?: number
  comment_count?: number
}

export interface ArticleGetData {
  article?: ArticleDetail
  user?: FeedUser
  tag?: string[]
  comment_id?: number
  like_status?: FeedLikeStatus
  reward_count?: number
  view_count?: number
  floor_num?: number
  category?: ArticleCategory
  favorite_count?: number
  noindex?: boolean
}

export function fetchArticleGet(
  id: number | string,
  exposureId = '',
  source = '',
  token?: string | null,
): Promise<MfunsApiEnvelope<ArticleGetData>> {
  return mfunsGet<ArticleGetData>(
    '/article/get',
    {
      id,
      html: 1,
      exposure_id: exposureId || undefined,
      source: source || undefined,
    },
    token,
  )
}

export function fetchSeriesItems(
  seriesId: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<{ list?: ArticleSeriesItem[] }>> {
  return mfunsGet<{ list?: ArticleSeriesItem[] }>(
    '/series/items',
    { series_id: seriesId },
    token,
  )
}
