import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface TagSearchItem {
  name?: string
  hot?: number
}

export function searchTags(
  name: string,
  token?: string | null,
): Promise<MfunsApiEnvelope<TagSearchItem[] | { list?: TagSearchItem[] }>> {
  return mfunsGet('/tag/search', { name }, token)
}
