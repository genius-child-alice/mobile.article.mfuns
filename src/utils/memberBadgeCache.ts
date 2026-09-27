import type { MfunsBadgeInfo } from '../api/memberBadgeApi'

const cache = new Map<number, MfunsBadgeInfo>()

export function getCachedBadge(id: number): MfunsBadgeInfo | undefined {
  return cache.get(id)
}

export function setCachedBadge(id: number, info: MfunsBadgeInfo): void {
  cache.set(id, info)
}

export function clearBadgeCache(): void {
  cache.clear()
}
