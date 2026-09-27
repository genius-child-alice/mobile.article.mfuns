import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface HomeContentUser {
  id?: number
  name?: string
  avatar?: string
  name_color?: string
}

export interface HomeContentItem {
  id: number
  title?: string
  summary?: string
  cover?: string
  cover_meta?: { blurhash?: string }
  tag?: string[]
  user?: HomeContentUser
  like_count?: number
  comment_count?: number
  view_count?: number
  duration?: number
  /** 0 文章 1 视频 */
  type?: number
  exposure_id?: string
}

export interface HomeRecommendData {
  list?: HomeContentItem[]
}

export interface HomeCategory {
  id: number
  name?: string
}

export function fetchRecommend(
  categoryId: number,
  size: number,
): Promise<MfunsApiEnvelope<HomeRecommendData>> {
  return mfunsGet<HomeRecommendData>('/recommend/get', {
    category: categoryId,
    size,
  })
}

export function fetchCategoryFeed(
  categoryId: number,
  page: number,
  size: number,
): Promise<MfunsApiEnvelope<HomeRecommendData>> {
  return mfunsGet<HomeRecommendData>('/category/list', {
    cid: categoryId,
    page,
    size,
  })
}

export function fetchAllCategories(): Promise<MfunsApiEnvelope<HomeCategory[]>> {
  return mfunsGet<HomeCategory[]>('/category/all')
}

export function fetchLeaderboardHot(): Promise<MfunsApiEnvelope<HomeContentItem[]>> {
  return mfunsGet<HomeContentItem[]>('/leaderboards/hot')
}

export function homeContentPath(item: HomeContentItem): string {
  if (item.type === 1) return `/video/${item.id}`
  return `/article/${item.id}`
}
