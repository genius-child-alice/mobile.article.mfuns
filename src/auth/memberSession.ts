/**
 * Login session (aligned with m.mfuns member_auth.isLogin).
 * Token storage keys will match login API when wired; until then reads common stores.
 */

const AUTH_STORAGE_KEY = 'mfuns_member_auth'

export interface MemberAuthState {
  token: string | null
  isLogin: boolean
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  )
  return match ? decodeURIComponent(match[1]) : null
}

/** Cookie names used by m.mfuns mobile clients (first non-empty wins). */
const TOKEN_COOKIE_NAMES = ['mfuns_token', 'member_token', 'token', 'Authorization'] as const

function readTokenFromCookies(): string | null {
  for (const name of TOKEN_COOKIE_NAMES) {
    const value = getCookie(name)?.trim()
    if (value) return value.replace(/^Bearer\s+/i, '')
  }
  return null
}

function readTokenFromStorage(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string | null }
    const token = parsed.token?.trim()
    return token || null
  } catch {
    return null
  }
}

export function readMemberAuthState(): MemberAuthState {
  const token = readTokenFromCookies() ?? readTokenFromStorage()
  return {
    token,
    isLogin: Boolean(token),
  }
}

export function persistMemberAuth(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (!token) {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token }))
}
