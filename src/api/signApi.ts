import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'

export interface SignListData {
  /** 日号 → 1 表示已签 */
  list?: Record<string | number, number>
  month_times?: number
  all_times?: number
}

export interface SignAwardItem {
  desc?: string
}

export type SignAccumulatedAwards = Record<string, SignAwardItem[]>

export function fetchSignIn(token: string): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsGet('/sign/sign', undefined, token)
}

export function fetchSignList(token: string): Promise<MfunsApiEnvelope<SignListData>> {
  return mfunsGet<SignListData>('/sign/sign_list', undefined, token)
}

export function fetchSignAgain(
  day: number,
  token: string,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/sign/sign_again', { day }, token)
}

export function fetchAccumulatedAwards(
  token: string,
): Promise<MfunsApiEnvelope<SignAccumulatedAwards>> {
  return mfunsGet<SignAccumulatedAwards>('/sign/accumulated_awards', undefined, token)
}

export interface SignRankEntry {
  user?: {
    id?: number
    name?: string
    avatar?: string
    name_color?: string
    level_id?: number
    badges?: number[]
  }
  time?: number
  count?: number
}

export function fetchSignRankToday(
  token?: string | null,
): Promise<MfunsApiEnvelope<SignRankEntry[] | { list?: SignRankEntry[] }>> {
  return mfunsGet('/sign/sign_rank_today', undefined, token)
}
