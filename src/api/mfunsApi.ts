/** m.mfuns mobile API (api.mfuns.net/v1). Dev requests go through Vite proxy. */

const API_BASE =
  import.meta.env.VITE_MFUNS_API_BASE ??
  (import.meta.env.DEV ? '/v1' : 'https://api.mfuns.net/v1')

export interface MfunsApiEnvelope<T = unknown> {
  code: number
  msg: string
  data?: T
}

export class MfunsApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

function joinUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE.replace(/\/$/, '')}${normalized}`
}

function buildJsonHeaders(token?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  const trimmed = token?.trim()
  if (trimmed) {
    headers.Authorization = trimmed
  }
  return headers
}

async function parseEnvelope<T>(res: Response): Promise<MfunsApiEnvelope<T>> {
  try {
    return (await res.json()) as MfunsApiEnvelope<T>
  } catch {
    throw new MfunsApiError(0, res.ok ? '响应解析失败' : `网络错误 (${res.status})`)
  }
}

export async function mfunsPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  token?: string | null,
): Promise<MfunsApiEnvelope<T>> {
  const res = await fetch(joinUrl(path), {
    method: 'POST',
    headers: {
      ...buildJsonHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return parseEnvelope<T>(res)
}

export async function mfunsGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined>,
  token?: string | null,
): Promise<MfunsApiEnvelope<T>> {
  let url = joinUrl(path)
  if (params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') search.set(key, String(value))
    }
    const qs = search.toString()
    if (qs) url += `${url.includes('?') ? '&' : '?'}${qs}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: buildJsonHeaders(token),
  })

  return parseEnvelope<T>(res)
}

/** multipart 上传（可选进度，对齐参考站 axios onUploadProgress） */
export function mfunsPostForm<T = unknown>(
  path: string,
  form: FormData,
  token?: string | null,
  onProgress?: (ratio: number) => void,
): Promise<MfunsApiEnvelope<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', joinUrl(path))
    const headers = buildJsonHeaders(token) as Record<string, string>
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.responseType = 'json'
    xhr.upload.onprogress = (ev) => {
      if (!onProgress || !ev.lengthComputable || ev.total <= 0) return
      onProgress(ev.loaded / ev.total)
    }
    xhr.onload = () => {
      const body = xhr.response as MfunsApiEnvelope<T> | null
      if (body && typeof body === 'object') {
        resolve(body)
        return
      }
      reject(new MfunsApiError(0, '响应解析失败'))
    }
    xhr.onerror = () => reject(new MfunsApiError(0, '网络错误'))
    xhr.send(form)
  })
}
