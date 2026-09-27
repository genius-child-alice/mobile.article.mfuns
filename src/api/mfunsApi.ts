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

export async function mfunsPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
): Promise<MfunsApiEnvelope<T>> {
  const res = await fetch(joinUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let payload: MfunsApiEnvelope<T>
  try {
    payload = (await res.json()) as MfunsApiEnvelope<T>
  } catch {
    throw new MfunsApiError(0, res.ok ? '响应解析失败' : `网络错误 (${res.status})`)
  }

  return payload
}
