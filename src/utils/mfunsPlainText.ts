/** Strip HTML tags for titles / meta (aligned with m.mfuns stripHtml helper). */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .trim()
}

/** Wrap plain text as minimal HTML paragraphs for comment create. */
export function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const parts = escaped.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return ''
  return parts.map((p) => `<p>${p}</p>`).join('')
}
