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

export const HOME_CONTENT_TYPE_ARTICLE = 0
export const HOME_CONTENT_TYPE_VIDEO = 1

/** 排行/推荐等列表在前端剔除视频（接口仍可能混入 type=1） */
export function filterHomeArticleItems(items: HomeContentItem[]): HomeContentItem[] {
  return items.filter((item) => item.type !== HOME_CONTENT_TYPE_VIDEO)
}

export interface HomeRecommendData {
  list?: HomeContentItem[]
}

export interface HomeCategory {
  id: number
  name?: string
}

/** 首页列表统一筛文章（type=0） */
const HOME_LIST_TYPE = 0

export function fetchRecommend(
  categoryId: number,
  size: number,
): Promise<MfunsApiEnvelope<HomeRecommendData>> {
  return mfunsGet<HomeRecommendData>('/recommend/get', {
    category: categoryId,
    size,
    type: HOME_LIST_TYPE,
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
    type: HOME_LIST_TYPE,
  })
}

export function fetchAllCategories(): Promise<MfunsApiEnvelope<HomeCategory[]>> {
  return mfunsGet<HomeCategory[]>('/category/all')
}

export function fetchLeaderboardHot(): Promise<MfunsApiEnvelope<HomeContentItem[]>> {
  return mfunsGet<HomeContentItem[]>('/leaderboards/hot', {
    type: HOME_LIST_TYPE,
  })
}

/** 参考站 leaderboards.site → 全站排行首 Tab */
export function fetchLeaderboardSite(): Promise<MfunsApiEnvelope<HomeContentItem[]>> {
  return mfunsGet<HomeContentItem[]>('/leaderboards/site', {
    type: HOME_LIST_TYPE,
  })
}

/** 参考站 leaderboards.get → 分区排行 */
export function fetchLeaderboardByCategory(
  cid: number,
): Promise<MfunsApiEnvelope<HomeContentItem[]>> {
  return mfunsGet<HomeContentItem[]>('/leaderboards/get', {
    cid,
    type: HOME_LIST_TYPE,
  })
}

export function homeContentPath(item: HomeContentItem): string {
  if (item.type === 1) return `/video/${item.id}`
  return `/article/${item.id}`
}
