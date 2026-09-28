import type { FeedItem } from '../api/feedsApi'

/** 时间线不展示：视频投稿同步、转发视频（resource_type=1 / extra_type=3） */
export function isVideoRelatedFeed(item: FeedItem): boolean {
  return item.resource_type === 1 || item.extra_type === 3
}

export function filterTimelineFeeds(items: FeedItem[]): FeedItem[] {
  return items.filter((item) => !isVideoRelatedFeed(item))
}
