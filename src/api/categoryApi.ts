import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface ArticleCategoryNode {
  id: number
  name?: string
  parent_id?: number
  children?: ArticleCategoryNode[]
}

export function fetchArticleCategories(
  token?: string | null,
): Promise<MfunsApiEnvelope<ArticleCategoryNode[]>> {
  return mfunsGet<ArticleCategoryNode[]>('/category/article', undefined, token)
}
