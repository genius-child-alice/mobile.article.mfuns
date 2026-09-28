import { ref } from 'vue'

const articleTitleOverride = ref<string | null>(null)
const articleSaveHandlers = new Set<() => void>()
const articlePublishHandlers = new Set<() => void>()
const feedPublishHandlers = new Set<() => void>()

export function setCreateArticleTitle(title: string | null) {
  articleTitleOverride.value = title
}

export function useCreateArticleTitleOverride() {
  return articleTitleOverride
}

export function triggerCreateArticleSave() {
  for (const h of articleSaveHandlers) h()
}

export function triggerCreateArticlePublish() {
  for (const h of articlePublishHandlers) h()
}

export function triggerCreateFeedPublish() {
  for (const h of feedPublishHandlers) h()
}

export function registerCreateArticleSave(handler: () => void): () => void {
  articleSaveHandlers.add(handler)
  return () => {
    articleSaveHandlers.delete(handler)
  }
}

export function registerCreateArticlePublish(handler: () => void): () => void {
  articlePublishHandlers.add(handler)
  return () => {
    articlePublishHandlers.delete(handler)
  }
}

export function registerCreateFeedPublish(handler: () => void): () => void {
  feedPublishHandlers.add(handler)
  return () => {
    feedPublishHandlers.delete(handler)
  }
}
