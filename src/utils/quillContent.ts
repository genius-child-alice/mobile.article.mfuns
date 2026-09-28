/** 参考站 Quill getContent = JSON.stringify(getContents()) */

export interface QuillDeltaOp {
  insert?: string | Record<string, unknown>
  attributes?: Record<string, unknown>
  delete?: number
  retain?: number
}

export interface QuillDelta {
  ops?: QuillDeltaOp[]
}

export function isQuillDeltaJson(raw: string): boolean {
  const s = raw?.trim()
  if (!s || s[0] !== '{') return false
  try {
    const d = JSON.parse(s) as QuillDelta
    return Array.isArray(d?.ops)
  } catch {
    return false
  }
}

/** 从 Delta JSON 或 HTML 取纯文本（校验/字数） */
export function quillPlainText(raw: string): string {
  if (!raw) return ''
  if (isQuillDeltaJson(raw)) {
    try {
      const delta = JSON.parse(raw) as QuillDelta
      const parts: string[] = []
      for (const op of delta.ops ?? []) {
        if (typeof op.insert === 'string') {
          parts.push(op.insert)
        } else if (op.insert && typeof op.insert === 'object') {
          const mention = op.insert.mention as { value?: string } | undefined
          if (mention?.value) parts.push(`@${mention.value}`)
          else if ('image' in op.insert) parts.push('')
          else parts.push('')
        }
      }
      return parts.join('').replace(/\n+$/g, '').trim()
    } catch {
      /* fall through */
    }
  }
  const d = document.createElement('div')
  d.innerHTML = raw
  return (d.textContent || '').trim()
}

export function quillCharCount(raw: string): number {
  return quillPlainText(raw).length
}
