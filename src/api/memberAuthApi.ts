import { mfunsGet, mfunsPost, type MfunsApiEnvelope } from './mfunsApi'
import { readMemberAuthState } from '../auth/memberSession'

export interface MemberLoginPayload {
  account: string
  password: string
  /** Geetest v4 validate payload; omitted until captcha is wired. */
  captcha?: Record<string, unknown>
}

export interface MemberLoginData {
  token?: string
  access_token?: string
  expires?: number
  member?: { name?: string }
}

export async function loginMember(
  payload: MemberLoginPayload,
): Promise<MfunsApiEnvelope<MemberLoginData>> {
  const body: Record<string, unknown> = {
    account: payload.account.trim(),
    password: payload.password,
    ...payload.captcha,
  }
  return mfunsPost<MemberLoginData>('/auth/login', body)
}

export function extractLoginToken(data: MemberLoginData | undefined): string | null {
  if (!data) return null
  const token = data.token?.trim() || data.access_token?.trim()
  return token || null
}

export async function logoutMember(): Promise<MfunsApiEnvelope<unknown>> {
  const { token } = readMemberAuthState()
  return mfunsGet('/auth/logout', undefined, token)
}
