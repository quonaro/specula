import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface RequestHistoryItem {
  id: string
  timestamp: number
  method: string
  path: string
  url: string
  status?: number
  statusText?: string
  duration?: number
  error?: boolean
  errorMessage?: string
  requestHeaders?: Record<string, string>
  requestBody?: any
  responseHeaders?: Record<string, string>
  responseData?: any
  operationId?: string
  specTitle?: string
  // Execution context
  serverUrl?: string
  authorization?: Record<string, string>
  parameters?: Record<string, any>
}

export const useRequestHistoryStore = defineStore('requestHistory', () => {
  const MAX_HISTORY_SIZE = 1000 // Maximum number of history items to keep
  const history = ref<RequestHistoryItem[]>([])

  // Load history from localStorage on initialization
  const loadHistory = () => {
    if (typeof localStorage === 'undefined') {
      return
    }

    try {
      const saved = localStorage.getItem('requestHistory')
      if (saved) {
        const parsed = JSON.parse(saved)
        history.value = Array.isArray(parsed) ? parsed : []
        // Ensure we don't exceed max size
        if (history.value.length > MAX_HISTORY_SIZE) {
          history.value = history.value.slice(-MAX_HISTORY_SIZE)
        }
      } else {
        history.value = []
      }
    } catch (error) {
      console.error('Failed to load request history:', error)
      history.value = []
    }
  }

  // Save history to localStorage
  const saveHistory = () => {
    if (typeof localStorage === 'undefined') return

    try {
      // Keep only last MAX_HISTORY_SIZE items
      const itemsToSave = history.value.slice(-MAX_HISTORY_SIZE)
      localStorage.setItem('requestHistory', JSON.stringify(itemsToSave))
    } catch (error) {
      console.error('Failed to save request history:', error)
    }
  }

  // Add request to history
  const addRequest = (item: Omit<RequestHistoryItem, 'id' | 'timestamp'>) => {
    const historyItem: RequestHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    history.value.push(historyItem)

    // Keep only last MAX_HISTORY_SIZE items
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value = history.value.slice(-MAX_HISTORY_SIZE)
    }

    saveHistory()
  }

  // Remove request from history
  const removeRequest = (id: string) => {
    const index = history.value.findIndex(item => item.id === id)
    if (index > -1) {
      history.value.splice(index, 1)
      saveHistory()
    }
  }

  // Clear all history
  const clearHistory = () => {
    history.value = []
    saveHistory()
  }

  // Clear history older than specified timestamp
  const clearHistoryOlderThan = (timestamp: number) => {
    const beforeLength = history.value.length
    history.value = history.value.filter(item => item.timestamp >= timestamp)
    if (history.value.length !== beforeLength) {
      saveHistory()
    }
  }

  // Get history filtered by criteria
  const getFilteredHistory = (filters: {
    method?: string
    path?: string
    status?: number
    error?: boolean
    specTitle?: string
    searchQuery?: string
  }) => {
    return computed(() => {
      let filtered = [...history.value]

      if (filters.method) {
        filtered = filtered.filter(item => item.method.toLowerCase() === filters.method!.toLowerCase())
      }

      if (filters.path) {
        filtered = filtered.filter(item => item.path.includes(filters.path!))
      }

      if (filters.status !== undefined) {
        filtered = filtered.filter(item => item.status === filters.status)
      }

      if (filters.error !== undefined) {
        filtered = filtered.filter(item => !!item.error === filters.error)
      }

      if (filters.specTitle) {
        filtered = filtered.filter(item => item.specTitle === filters.specTitle)
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        filtered = filtered.filter(item =>
          item.path.toLowerCase().includes(query) ||
          item.method.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query) ||
          (item.operationId && item.operationId.toLowerCase().includes(query))
        )
      }

      // Sort by timestamp (newest first)
      return filtered.sort((a, b) => b.timestamp - a.timestamp)
    })
  }

  // Get history item by ID
  const getRequestById = (id: string): RequestHistoryItem | undefined => {
    return history.value.find(item => item.id === id)
  }

  // Get recent requests (last N items)
  const getRecentRequests = (count: number = 10) => {
    return computed(() => {
      return [...history.value]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, count)
    })
  }

  // Get statistics
  const getStatistics = () => {
    return computed(() => {
      const total = history.value.length
      const successful = history.value.filter(item => !item.error && item.status && item.status >= 200 && item.status < 300).length
      const errors = history.value.filter(item => item.error || (item.status && item.status >= 400)).length
      const avgDuration = history.value
        .filter(item => item.duration !== undefined)
        .reduce((sum, item) => sum + (item.duration || 0), 0) /
        history.value.filter(item => item.duration !== undefined).length || 0

      return {
        total,
        successful,
        errors,
        avgDuration: Math.round(avgDuration),
      }
    })
  }

  // Initialize on store creation
  loadHistory()

  return {
    history, // Export ref directly - Pinia will make it reactive
    addRequest,
    removeRequest,
    clearHistory,
    clearHistoryOlderThan,
    getFilteredHistory,
    getRequestById,
    getRecentRequests,
    getStatistics,
  }
})

