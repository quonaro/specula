import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './index.css'
import App from './App.vue'
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'
import { useSpecStore } from './stores/spec'
import type { OpenAPISpec } from './types/openapi'
// Import logo - will be replaced with Base64 string by vite-plugin-logo-base64 in standalone build
import logoUrl from '/logo.png'

// Import pages directly for standalone bundle (no code splitting)
import Index from './pages/Index.vue'
import NotFound from './pages/NotFound.vue'

export interface SpeculaConfig {
  container: string | HTMLElement
  openapi: string | string[]
}

export interface SpeculaInstance {
  loadSpec: (url: string | string[]) => Promise<void>
  destroy: () => void
}

let instanceCount = 0

/**
 * Initialize Specula in a container
 * @param config Configuration object
 * @returns Specula instance with methods to control it
 */
export async function init(config: SpeculaConfig): Promise<SpeculaInstance> {
  // Mark as standalone mode and set logo URL BEFORE creating app
  // This ensures they are available when components mount
  ;(window as any).__SPECULA_STANDALONE__ = true
  ;(window as any).__SPECULA_LOGO_URL__ = logoUrl

  const containerId = `specula-${instanceCount++}`
  const container = typeof config.container === 'string' 
    ? document.querySelector(config.container) as HTMLElement
    : config.container

  if (!container) {
    throw new Error(`Container not found: ${config.container}`)
  }

  // Create app container
  const appContainer = document.createElement('div')
  appContainer.id = containerId
  container.appendChild(appContainer)

  const pinia = createPinia()

  // Use hash history for standalone to avoid server configuration issues
  // No /selection route in standalone mode - always show Index
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', component: Index },
      { path: '/group/:groupPath', component: Index },
      { path: '/spec/:specId/endpoint/:method/:path(.*)', component: Index },
      { path: '/endpoint/:method/:path(.*)', component: Index },
      { path: '/:pathMatch(.*)*', component: Index }
    ]
  })

  const app = createApp(App)
  app.use(pinia)
  app.use(router)

  // Initialize theme before mounting
  const themeStore = useThemeStore()
  themeStore.initTheme()

  // Initialize settings before mounting
  const settingsStore = useSettingsStore()

  app.use(Toast, {
    position: 'top-right',
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: false,
    pauseOnHover: false,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false
  })

  // Load spec BEFORE mounting if provided
  const specStore = useSpecStore()
  
  const loadSpec = async (url: string | string[]) => {
    const urls = Array.isArray(url) ? url : [url]
    const loadedSpecs = []

    for (const specUrl of urls) {
      try {
        const response = await fetch(specUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const spec: OpenAPISpec = await response.json()
        const title = spec.info?.title || 'Untitled Specification'
        
        loadedSpecs.push({
          spec,
          sourceUrl: specUrl,
          title,
        })
      } catch (error: any) {
        console.error(`Failed to load spec from ${specUrl}:`, error)
        throw error
      }
    }

    if (loadedSpecs.length > 0) {
      specStore.setSpecs(loadedSpecs)
    }
  }

  // Load initial spec if provided (before mounting to avoid selection page)
  if (config.openapi) {
    try {
      await loadSpec(config.openapi)
    } catch (error) {
      console.error('Failed to load initial OpenAPI spec:', error)
    }
  }

  // Mount app after spec is loaded (if provided)
  app.mount(`#${containerId}`)

  const destroy = () => {
    app.unmount()
    appContainer.remove()
  }

  return {
    loadSpec,
    destroy
  }
}

// Make it available globally if loaded via script tag
if (typeof window !== 'undefined') {
  (window as any).Specula = { init }
}

