import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'
import type { MemberUserInfo } from './memberUserApi'

export interface NotifyCountData {
  comment?: number
  like?: number
  mention?: number
  system?: number
}

export interface MessageLastMsg {
  data?: {
    message?: string
    time?: number
  }
}

export interface MessageThreadItem {
  user?: MemberUserInfo
  last_msg?: MessageLastMsg
  no_read?: number
  /** 格式化后的相对时间（客户端填充） */
  time?: string
}

/** 1=点赞 2=评论 3=提及 */
export type NotifyListType = 1 | 2 | 3

export interface NotifyParams {
  type?: string
  text?: string
  reply_text?: string
  count?: number
}

export interface NotifyListItem {
  id?: number
  user?: MemberUserInfo
  notify_params?: NotifyParams
  created_at?: number | string
  content_id?: number
  content_type?: number
}

export interface SiteNotifyItem {
  id?: number
  title?: string
  content?: string
  created_at?: number | string
}

export interface MessageRecordData {
  message?: string
  time?: number
}

export interface MessageRecordItem {
  msg_id: number
  uid: number
  data?: MessageRecordData
}

/** 参考站 notify.count → GET /notify/count */
export function fetchNotifyCount(
  token: string,
): Promise<MfunsApiEnvelope<NotifyCountData>> {
  return mfunsGet<NotifyCountData>('/notify/count', undefined, token)
}

/** 参考站 getNotifyList → GET /notify/get */
export function fetchNotifyList(
  type: NotifyListType,
  page: number,
  token: string,
): Promise<MfunsApiEnvelope<NotifyListItem[]>> {
  return mfunsGet<NotifyListItem[]>('/notify/get', { type, page }, token)
}

/** 参考站 getSiteNotify → GET /notify/site */
export function fetchSiteNotify(
  page: number,
  token: string,
): Promise<MfunsApiEnvelope<SiteNotifyItem[]>> {
  return mfunsGet<SiteNotifyItem[]>('/notify/site', { page, html: 1 }, token)
}

/** 参考站 message.msgList → GET /message/list */
export function fetchMessageList(
  token: string,
): Promise<MfunsApiEnvelope<MessageThreadItem[]>> {
  return mfunsGet<MessageThreadItem[]>('/message/list', undefined, token)
}

/** 参考站 getMsg → GET /message/record?uid=&html=1 */
export function fetchMessageRecord(
  uid: number,
  token: string,
): Promise<MfunsApiEnvelope<MessageRecordItem[]>> {
  return mfunsGet<MessageRecordItem[]>(
    '/message/record',
    { uid, html: 1 },
    token,
  )
}

/** 参考站 getHistoryMsg → GET /message/record?uid=&msg_id=&html=1 */
export function fetchMessageHistory(
  uid: number,
  msgId: number,
  token: string,
): Promise<MfunsApiEnvelope<MessageRecordItem[]>> {
  return mfunsGet<MessageRecordItem[]>(
    '/message/record',
    { uid, msg_id: msgId, html: 1 },
    token,
  )
}

/** 参考站 asyncMsg → GET /message/record?uid=&msg_id=&async=1&html=1 */
export function fetchMessageAsync(
  uid: number,
  msgId: number,
  token: string,
): Promise<MfunsApiEnvelope<MessageRecordItem[]>> {
  return mfunsGet<MessageRecordItem[]>(
    '/message/record',
    { uid, msg_id: msgId, async: 1, html: 1 },
    token,
  )
}

export function sendMessage(
  toUid: number,
  msg: string,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/message/send', { to_uid: toUid, msg }, token)
}
