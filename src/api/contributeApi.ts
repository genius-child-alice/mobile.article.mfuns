import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface ContributeItem {
  id: number
  type?: number
  status?: number
  title?: string
  cover?: string
  created_at?: string
  resource_id?: number
  resource?: {
    id?: number
    /** 0 文章 MA / 1 视频 MV（参考 ContentInfoListItem） */
    type?: number
    like_count?: number
    view_count?: number
    comment_count?: number
  }
  category_id?: number
  content?: string
  tags?: string | string[]
  copyright?: number
  result?: { reason?: string }
}

export interface ContributeListData {
  list?: ContributeItem[]
  total?: number
}

export function fetchContributeList(
  page: number,
  size: number,
  status: number,
  token: string,
): Promise<MfunsApiEnvelope<ContributeListData>> {
  return mfunsGet<ContributeListData>(
    '/contribute/list',
    {
      page,
      size,
      status: status >= 0 ? status : undefined,
      type: 0,
    },
    token,
  )
}

export function fetchContributeGet(
  contributeId: number,
  token: string,
): Promise<MfunsApiEnvelope<{ contribute?: ContributeItem }>> {
  return mfunsGet('/contribute/get', { contribute_id: contributeId }, token)
}

export function createContributeArticle(
  body: {
    title: string
    content: string
    cid: number
    tags: string
    cover: string
    copyright: number
    draft: boolean
  },
  token: string,
): Promise<MfunsApiEnvelope<{ contribute?: { id?: number } }>> {
  return mfunsPost('/contribute/article/create', body, token)
}

export function updateContributeArticle(
  body: {
    contribute_id: number
    title: string
    content: string
    cid: number
    tags: string
    cover: string
    copyright: number
    draft: boolean
  },
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/contribute/article/update', body, token)
}

export function deleteContributeArticle(
  contributeId: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/contribute/article/delete', { contribute_id: contributeId }, token)
}
