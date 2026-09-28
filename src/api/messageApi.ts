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

/** 参考站 notify.count → GET /notify/count */
export function fetchNotifyCount(
  token: string,
): Promise<MfunsApiEnvelope<NotifyCountData>> {
  return mfunsGet<NotifyCountData>('/notify/count', undefined, token)
}

/** 参考站 message.msgList → GET /message/list */
export function fetchMessageList(
  token: string,
): Promise<MfunsApiEnvelope<MessageThreadItem[]>> {
  return mfunsGet<MessageThreadItem[]>('/message/list', undefined, token)
}

export function sendMessage(
  toUid: number,
  msg: string,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/message/send', { to_uid: toUid, msg }, token)
}
