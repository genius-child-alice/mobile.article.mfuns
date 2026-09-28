export function formatRelativeUnixTime(unixSeconds: number | undefined): string {
  if (unixSeconds == null || !Number.isFinite(unixSeconds)) return ''
  const then = unixSeconds * 1000
  const diff = Date.now() - then
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`
  if (diff < 86_400_000 * 30) return `${Math.floor(diff / 86_400_000)} 天前`
  const d = new Date(then)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 接受 unix 秒 / 毫秒时间戳 / ISO 日期字符串 */
export function formatRelativeTime(raw: number | string | undefined): string {
  if (raw == null || raw === '') return ''
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return ''
    return formatRelativeUnixTime(raw > 1e12 ? Math.floor(raw / 1000) : raw)
  }
  const n = Number(raw)
  if (Number.isFinite(n) && String(raw).trim() !== '') {
    return formatRelativeUnixTime(n > 1e12 ? Math.floor(n / 1000) : n)
  }
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return ''
  return formatRelativeUnixTime(Math.floor(ms / 1000))
}

/** Absolute datetime for profile created_at (aligned with m.mfuns datetimeFormat). */
export function formatUnixDatetime(unixSeconds: number | undefined): string {
  if (unixSeconds == null || !Number.isFinite(unixSeconds)) return '—'
  const d = new Date(unixSeconds * 1000)
  if (Number.isNaN(d.getTime())) return '—'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}
