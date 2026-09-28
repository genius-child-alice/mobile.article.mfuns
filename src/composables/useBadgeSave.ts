const saveHandlers = new Set<() => void>()

export function triggerBadgeSave() {
  for (const h of saveHandlers) h()
}

export function registerBadgeSave(handler: () => void): () => void {
  saveHandlers.add(handler)
  return () => {
    saveHandlers.delete(handler)
  }
}
