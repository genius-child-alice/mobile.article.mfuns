import { mfunsGet, type MfunsApiEnvelope } from './mfunsApi'

export interface MemberSecurityInfo {
  phone?: string | null
  email?: string | null
}

export interface LoginSessionDevice {
  id?: number
  device?: string
  ip?: string
  last_active?: number
}

export interface ActiveLoginSessionData {
  devices?: LoginSessionDevice[]
  current?: LoginSessionDevice
}

export function fetchMemberSecurityInfo(
  token: string,
): Promise<MfunsApiEnvelope<MemberSecurityInfo>> {
  return mfunsGet<MemberSecurityInfo>('/auth/user_security_info', undefined, token)
}

export function fetchActiveLoginSessions(
  token: string,
): Promise<MfunsApiEnvelope<ActiveLoginSessionData>> {
  return mfunsGet<ActiveLoginSessionData>('/auth/get_active_login_session', undefined, token)
}
