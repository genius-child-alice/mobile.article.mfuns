import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'
import type { FeedItem } from './feedsApi'
import type { HomeContentItem } from './homeApi'

export interface TagSearchItem {
  name?: string
  hot?: number
}

export interface TagListCursorData<T> {
  list?: T[]
  last_id?: number
}

export function searchTags(
  name: string,
  token?: string | null,
): Promise<MfunsApiEnvelope<TagSearchItem[] | { list?: TagSearchItem[] }>> {
  return mfunsGet('/tag/search', { name }, token)
}

/** 参考站 tag.article → GET /tag/article_list */
export function fetchTagArticleList(
  tag: string,
  lastId?: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<TagListCursorData<HomeContentItem> | HomeContentItem[]>> {
  return mfunsGet(
    '/tag/article_list',
    { tag, last_id: lastId && lastId > 0 ? lastId : undefined },
    token,
  )
}

/** 参考站 tag.feed → GET /tag/feed_list */
export function fetchTagFeedList(
  tag: string,
  lastId?: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<TagListCursorData<FeedItem> | FeedItem[]>> {
  return mfunsGet(
    '/tag/feed_list',
    {
      tag,
      last_id: lastId && lastId > 0 ? lastId : undefined,
      html: 1,
    },
    token,
  )
}
