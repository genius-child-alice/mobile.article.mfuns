/** Resource deep links (aligned with m.mfuns getResourceUrl). */
export function mfunsResourcePath(resourceType: number, resourceId: number): string {
  if (resourceType === 1) return `/video/${resourceId}`
  if (resourceType === 3) return `/feed/${resourceId}`
  return `/article/${resourceId}`
}
