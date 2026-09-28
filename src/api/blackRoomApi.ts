import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface BlackRoomUser {
  id?: number
  name?: string
  avatar?: string
  name_color?: string
  level_id?: number
  badges?: number[]
  info?: string
}

export interface BlackRoomInfo {
  id?: number
  created_at?: number
  unblock_time?: number
  info?: string
}

export interface BlackRoomItem {
  user?: BlackRoomUser
  info?: BlackRoomInfo
}

export interface BlackRoomMyListData {
  credits?: number
  count?: number
}

export function fetchBlackRoomMyList(
  token?: string | null,
): Promise<MfunsApiEnvelope<BlackRoomMyListData>> {
  return mfunsGet<BlackRoomMyListData>('/black_room/my_list', undefined, token)
}

export function fetchBlackRoomList(
  token?: string | null,
): Promise<MfunsApiEnvelope<{ list?: BlackRoomItem[] }>> {
  return mfunsGet<{ list?: BlackRoomItem[] }>('/black_room/list', undefined, token)
}

export function fetchBlackRoomGet(
  id: number,
  token?: string | null,
): Promise<MfunsApiEnvelope<BlackRoomItem>> {
  return mfunsGet<BlackRoomItem>('/black_room/get', { id }, token)
}
