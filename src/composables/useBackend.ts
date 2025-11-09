import { useBackendStore } from '@/stores/backend'

/**
 * Get backend URL from environment or use default
 */
function getBackendUrl(): string {
  // Try to get from environment variable first
  const envUrl = import.meta.env.VITE_BACKEND_URL
  if (envUrl) {
    return envUrl
  }

  // Try to detect from current origin
  const origin = window.location.origin
  const url = new URL(origin)
  
  // If frontend is on port 8080, backend might be on 8000
  if (url.port === '8080') {
    url.port = '8000'
    return url.toString()
  }

  // Default: try same origin (for production where they might be on same domain)
  return origin
}

/**
 * Check if backend is available by pinging health endpoint
 */
async function checkBackendHealth(url: string, timeout: number = 3000): Promise<boolean> {
  try {
    const healthUrl = `${url.replace(/\/$/, '')}/health`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    // Consider 200-299 as success
    return response.ok
  } catch (error) {
    // Network error, timeout, or other issues
    return false
  }
}

/**
 * Composable for backend availability checking
 */
export function useBackend() {
  const backendStore = useBackendStore()

  /**
   * Check backend availability
   */
  const checkBackend = async (customUrl?: string): Promise<boolean> => {
    if (backendStore.isChecking) {
      // Already checking, return current status
      return backendStore.isAvailable
    }

    backendStore.setChecking(true)

    try {
      const url = customUrl || getBackendUrl()
      const isAvailable = await checkBackendHealth(url)

      backendStore.setAvailable(isAvailable, isAvailable ? url : null)
      return isAvailable
    } catch (error) {
      backendStore.setAvailable(false, null)
      return false
    } finally {
      backendStore.setChecking(false)
    }
  }

  /**
   * Get current backend URL
   */
  const getBackendUrlForUse = (): string | null => {
    return backendStore.backendUrl || getBackendUrl()
  }

  return {
    isAvailable: backendStore.isAvailable,
    isChecking: backendStore.isChecking,
    backendUrl: backendStore.backendUrl,
    lastCheckTime: backendStore.lastCheckTime,
    checkBackend,
    getBackendUrl: getBackendUrlForUse,
  }
}

