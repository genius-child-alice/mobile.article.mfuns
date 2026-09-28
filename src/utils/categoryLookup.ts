import type { ArticleCategoryNode } from '../api/categoryApi'

export function findCategoryPath(
  roots: ArticleCategoryNode[],
  id: number,
): { id: number; name: string } | null {
  for (const root of roots) {
    if (root.id === id) {
      return { id, name: root.name || String(id) }
    }
    for (const child of root.children ?? []) {
      if (child.id === id) {
        const parent = root.name || ''
        const childName = child.name || String(id)
        return {
          id,
          name: parent ? `${parent} / ${childName}` : childName,
        }
      }
      for (const grand of child.children ?? []) {
        if (grand.id === id) {
          const parts = [root.name, child.name, grand.name].filter(Boolean)
          return { id, name: parts.join(' / ') || String(id) }
        }
      }
    }
  }
  return null
}
