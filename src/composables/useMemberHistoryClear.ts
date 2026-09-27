import { ref } from 'vue'

const clearDialogOpen = ref(false)
const afterClearHandlers = new Set<() => void>()

export function openMemberHistoryClearDialog() {
  clearDialogOpen.value = true
}

export function useMemberHistoryClearDialog() {
  return clearDialogOpen
}

export function registerMemberHistoryClearedHandler(handler: () => void): () => void {
  afterClearHandlers.add(handler)
  return () => {
    afterClearHandlers.delete(handler)
  }
}

export function notifyMemberHistoryCleared() {
  for (const handler of afterClearHandlers) {
    handler()
  }
}
