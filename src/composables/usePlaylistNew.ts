import { ref } from 'vue'

const createDialogOpen = ref(false)
const openHandlers = new Set<() => void>()

export function openPlaylistCreateDialog() {
  createDialogOpen.value = true
  for (const handler of openHandlers) handler()
}

export function usePlaylistCreateDialog() {
  return createDialogOpen
}

export function registerPlaylistCreateOpenHandler(handler: () => void): () => void {
  openHandlers.add(handler)
  return () => {
    openHandlers.delete(handler)
  }
}
