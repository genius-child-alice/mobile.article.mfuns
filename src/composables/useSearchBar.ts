import { ref } from 'vue'

const HISTORY_KEY = 'search_history'
const MAX_HISTORY = 20

const query = ref('')
const activeSearch = ref('')
const history = ref<string[]>(loadHistory())

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function persistHistory(list: string[]) {
  history.value = list
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

export function addSearchHistory(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return
  const next = [trimmed, ...history.value.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
  persistHistory(next)
}

export function clearSearchHistory() {
  persistHistory([])
}

export function setActiveSearch(text: string) {
  activeSearch.value = text.trim()
}

export function clearSearchState() {
  query.value = ''
  activeSearch.value = ''
}

/** 参考站 SearchPage：快捷 ID + 写入历史并触发结果区 */
export function submitSearchInput(
  content: string,
  navigate: (path: string) => void,
): boolean {
  const trimmed = content.trim()
  if (!trimmed || /^\s.$/.test(trimmed)) return false

  const match = trimmed.match(/^(MF|MA|MV|UID)(\d+)$/i)
  if (match) {
    switch (match[1].toUpperCase()) {
      case 'MF':
        navigate(`/feed/${match[2]}`)
        return true
      case 'MA':
        navigate(`/article/${match[2]}`)
        return true
      case 'MV':
        return false
      case 'UID':
        navigate(`/member/${match[2]}`)
        return true
      default:
        break
    }
  }

  addSearchHistory(trimmed)
  setActiveSearch(trimmed)
  return true
}

export function useSearchBar() {
  return {
    query,
    activeSearch,
    history,
  }
}
