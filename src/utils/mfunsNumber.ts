/** 对齐参考站 numberToSimplerText 过滤器 */
export function numberToSimplerText(value: number | undefined | null): string {
  const n = value ?? 0
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n < 10_000) return String(n)
  const wan = n / 10_000
  const text = wan >= 100 ? String(Math.round(wan)) : wan.toFixed(1).replace(/\.0$/, '')
  return `${text}万`
}
