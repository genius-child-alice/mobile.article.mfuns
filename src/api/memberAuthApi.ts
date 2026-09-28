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

/** 参考站 auth.send_register_sms → POST /auth/send_sms_code */
export function sendRegisterSmsCode(phone: string): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/auth/send_sms_code', { phone: phone.trim() })
}

export interface MemberRegisterPayload {
  name: string
  password: string
  phone: string
  code: string
  /** Geetest v4 validate payload */
  captcha?: Record<string, unknown>
}

export function registerMember(
  payload: MemberRegisterPayload,
): Promise<MfunsApiEnvelope<unknown>> {
  const body: Record<string, unknown> = {
    name: payload.name.trim(),
    password: payload.password,
    phone: payload.phone.trim(),
    code: payload.code.trim(),
    ...payload.captcha,
  }
  return mfunsPost('/auth/register', body)
}

export function sendPasswordResetCode(phone: string): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/auth/send_password_reset_code', { phone: phone.trim() })
}

export function resetPassword(payload: {
  phone: string
  phone_code: string
  password: string
}): Promise<MfunsApiEnvelope<unknown>> {
  return mfunsPost('/auth/reset_password', {
    phone: payload.phone.trim(),
    phone_code: payload.phone_code.trim(),
    password: payload.password,
  })
}
