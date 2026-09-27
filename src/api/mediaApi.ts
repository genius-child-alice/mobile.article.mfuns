import {
  mfunsGet,
  mfunsPost,
  mfunsPostForm,
  type MfunsApiEnvelope,
} from './mfunsApi'

export interface MfunsMediaFile {
  id?: number
  file_path?: string
  file_name?: string
  blurhash?: string
  created_at?: number
  width?: number
  height?: number
}

export interface MfunsMediaUploadData {
  file?: MfunsMediaFile
}

export interface MfunsMediaLibraryData {
  images?: MfunsMediaFile[]
}

export function uploadMediaImage(
  token: string,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<MfunsApiEnvelope<MfunsMediaUploadData>> {
  const form = new FormData()
  form.append('file', file)
  return mfunsPostForm<MfunsMediaUploadData>('/media/upload_image', form, token, onProgress)
}

/** 秒传：参数名仍为 sha1，参考站实际传 SHA-256 hex */
export function uploadMediaBySha1(
  token: string,
  sha1: string,
  name: string,
): Promise<MfunsApiEnvelope<MfunsMediaUploadData>> {
  return mfunsPost<MfunsMediaUploadData>('/media/upload_sha1', { sha1, name }, token)
}

export function fetchMediaLibrary(
  token: string,
  lastId = 0,
): Promise<MfunsApiEnvelope<MfunsMediaLibraryData>> {
  return mfunsGet<MfunsMediaLibraryData>('/media/library', { last_id: lastId }, token)
}

export function deleteMediaItem(
  token: string,
  id: number,
): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/media/delete', { id }, token)
}

export function uploadMediaImageUrl(
  token: string,
  url: string,
): Promise<MfunsApiEnvelope<MfunsMediaUploadData>> {
  return mfunsPost<MfunsMediaUploadData>('/media/upload_image_url', { url }, token)
}

export async function sha256HexOfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
