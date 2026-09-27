/** CDN resize helper (aligned with m.mfuns imageUrl filter). */
export function mfunsImageUrl(path: string | undefined | null, width = 1000): string {
  if (!path || typeof path !== 'string') return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (!path.startsWith('/')) return path

  const normalized = path.split('?')[0]
  if (width === 0) return `https://cdn2.mfuns.net${normalized}`
  return `https://cdn2.mfuns.net${normalized}?image_process=resize,w_${width}`
}
