import { ref, shallowReadonly } from 'vue'

const chatTitle = ref('')

export function useMessageChatTitle() {
  return shallowReadonly(chatTitle)
}

export function setMessageChatTitle(title: string) {
  chatTitle.value = title
}

export function clearMessageChatTitle() {
  chatTitle.value = ''
}
