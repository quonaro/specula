import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './index.css'
import App from './App.vue'
import { useThemeStore } from './stores/theme'
import { useSettingsStore } from './stores/settings'
// Import logo - will be replaced with Base64 string by vite-plugin-logo-base64 in standalone build
import logoUrl from '/logo.png'

// Import pages directly for standalone bundle (no code splitting)
import Index from './pages/Index.vue'
import NotFound from './pages/NotFound.vue'

export interface CustomTheme {
  id: string
  name: string
  cssUrl: string
}

export interface SpeculaConfig {
  container: string | HTMLElement
  openapi: string | string[]
  base?: string // Base path for routing (e.g., '/docs' for FastAPI integration)
  themes?: Record<string, string> // Custom themes: { "Theme Name": "https://example.com/theme.css" }
}

export interface SpeculaInstance {
  loadSpec: (url: string | string[]) => Promise<void>
  destroy: () => void
}

let instanceCount = 0

/**
 * Update URL query parameter `spec` without reloading the page.
 * This allows the existing URL-based loading logic (watchers in Index.vue)
 * to be the single source of truth for fetching OpenAPI specs.
 */
async function updateSpecQuery(urls: string | string[]): Promise<void> {
  if (typeof window === 'undefined') return

  const values = Array.isArray(urls) ? urls : [urls]
  const currentUrl = new URL(window.location.href)
  const params = currentUrl.searchParams

  // Replace existing spec parameters with the new list
  params.delete('spec')
  for (const v of values) {
    params.append('spec', v)
  }

  currentUrl.search = params.toString()
  window.history.replaceState(null, '', currentUrl.toString())
}

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
  
  // Normalize base path: ensure it starts with / and ends without /
  let basePath = '/'
  if (config.base) {
    basePath = config.base.trim()
    if (!basePath.startsWith('/')) {
      basePath = '/' + basePath
    }
    if (basePath.endsWith('/') && basePath.length > 1) {
      basePath = basePath.slice(0, -1)
    }
  }
  
  // Store base path globally for use in components
  ;(window as any).__SPECULA_BASE_PATH__ = basePath

  // If initial OpenAPI URL is provided, reflect it in the URL as ?spec=...
  // so that the existing URL-based loader in Index.vue fetches the spec.
  if (config.openapi) {
    await updateSpecQuery(config.openapi)
  }

  // Set favicon from Base64 logo
  if (typeof document !== 'undefined') {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.type = 'image/png'
      document.head.appendChild(favicon)
    }
    favicon.href = logoUrl
  }

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
  // Set styles to ensure full width and height in standalone mode
  appContainer.style.width = '100%'
  appContainer.style.height = '100%'
  container.appendChild(appContainer)

  const pinia = createPinia()

  // Use web history for clean URLs in standalone mode
  // Simplified routing format: /:method/:path (e.g., /PUT/pet)
  // Base path can be configured (e.g., '/docs' for FastAPI integration)
  // No /selection route in standalone mode - always show Index
  const router = createRouter({
    history: createWebHistory(basePath),
    routes: [
      { path: '/', component: Index },
      { path: '/:method/:path(.*)', component: Index },
      { path: '/:pathMatch(.*)*', component: Index }
    ]
  })

  const app = createApp(App)
  app.use(pinia)
  app.use(router)

  // Initialize theme before mounting
  const themeStore = useThemeStore()
  
  // Add custom themes from config if provided
  if (config.themes) {
    for (const [name, cssUrl] of Object.entries(config.themes)) {
      const themeId = name.toLowerCase().replace(/\s+/g, '-')
      themeStore.addCustomTheme({
        id: themeId,
        name: name,
        cssUrl: cssUrl,
      })
    }
  }
  
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

  // New implementation of loadSpec: just update ?spec=... in URL.
  // Actual fetching is handled by watchers inside the app (Index.vue).
  const loadSpec = async (url: string | string[]) => {
    await updateSpecQuery(url)
  }

  // Mount app; specs will be loaded by URL-based logic
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

// End of File


