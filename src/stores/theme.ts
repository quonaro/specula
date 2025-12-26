import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export type Theme = 'light' | 'light-1' | 'light-2' | 'light-3' | 'dark' | 'dark-1' | 'dark-2' | 'dark-3' | 'deepdark' | 'system' | string // string for custom themes

export interface CustomTheme {
  id: string
  name: string
  cssUrl: string
}

export const useThemeStore = defineStore('theme', () => {
  const customThemes = ref<CustomTheme[]>([])
  const previewThemeId = ref<string | null>(null) // For theme preview
  const loadedThemeLinks = ref<Map<string, HTMLLinkElement>>(new Map())

  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'system'
    
    const savedTheme = localStorage.getItem('theme') as Theme | null
    const builtInThemes = ['light', 'light-1', 'light-2', 'light-3', 'dark', 'dark-1', 'dark-2', 'dark-3', 'deepdark', 'system']
    if (savedTheme && builtInThemes.includes(savedTheme)) {
      return savedTheme
    }
    
    // Check if it's a custom theme
    if (savedTheme && savedTheme.startsWith('custom:')) {
      return savedTheme
    }
    
    return 'system'
  }

  const theme = ref<Theme>(getInitialTheme())

  // Load custom themes from localStorage
  const loadCustomThemes = () => {
    if (typeof localStorage === 'undefined') return
    
    try {
      const saved = localStorage.getItem('customThemes')
      if (saved) {
        const parsed = JSON.parse(saved)
        customThemes.value = Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error)
      customThemes.value = []
    }
  }

  // Save custom themes to localStorage
  const saveCustomThemes = () => {
    if (typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem('customThemes', JSON.stringify(customThemes.value))
    } catch (error) {
      console.error('Failed to save custom themes:', error)
    }
  }

  // Add custom theme
  const addCustomTheme = (theme: CustomTheme) => {
    const existingIndex = customThemes.value.findIndex(t => t.id === theme.id)
    if (existingIndex > -1) {
      customThemes.value[existingIndex] = theme
    } else {
      customThemes.value.push(theme)
    }
    saveCustomThemes()
  }

  // Remove custom theme
  const removeCustomTheme = (id: string) => {
    const index = customThemes.value.findIndex(t => t.id === id)
    if (index > -1) {
      customThemes.value.splice(index, 1)
      // Remove loaded link if exists
      const link = loadedThemeLinks.value.get(id)
      if (link && link.parentNode) {
        link.parentNode.removeChild(link)
      }
      loadedThemeLinks.value.delete(id)
      saveCustomThemes()
    }
  }

  // Load custom theme CSS
  const loadCustomThemeCSS = async (themeId: string): Promise<boolean> => {
    const customTheme = customThemes.value.find(t => t.id === themeId)
    if (!customTheme) return false

    // Check if already loaded
    if (loadedThemeLinks.value.has(themeId)) {
      return true
    }

    try {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = customTheme.cssUrl
      link.id = `custom-theme-${themeId}`
      
      // Add data attribute to identify custom theme
      link.setAttribute('data-theme-id', themeId)
      
      // Load with promise
      await new Promise((resolve, reject) => {
        link.onload = () => resolve(true)
        link.onerror = () => reject(new Error(`Failed to load theme CSS: ${customTheme.cssUrl}`))
        document.head.appendChild(link)
      })

      loadedThemeLinks.value.set(themeId, link)
      return true
    } catch (error) {
      console.error('Failed to load custom theme CSS:', error)
      return false
    }
  }

  // Unload custom theme CSS
  const unloadCustomThemeCSS = (themeId: string) => {
    const link = loadedThemeLinks.value.get(themeId)
    if (link && link.parentNode) {
      link.parentNode.removeChild(link)
      loadedThemeLinks.value.delete(themeId)
    }
  }

  // Preview theme (loads CSS but doesn't set as active)
  const previewTheme = async (themeId: string | null) => {
    if (typeof document === 'undefined') return

    // If previewing the same as active, do nothing
    if (themeId === theme.value) {
      previewThemeId.value = null
      return
    }

    // Unload previous preview if exists and different from active
    if (previewThemeId.value && previewThemeId.value !== theme.value) {
      const prevThemeId = previewThemeId.value
      if (prevThemeId.startsWith('custom:')) {
        const customId = prevThemeId.replace('custom:', '')
        unloadCustomThemeCSS(customId)
      } else if (prevThemeId === 'light' || prevThemeId === 'dark') {
        // For built-in themes, just remove dark class if previewing
        document.documentElement.classList.remove('dark')
      }
    }

    previewThemeId.value = themeId

    if (!themeId) {
      // Clear preview - restore active theme with smooth transition
      if (theme.value && typeof theme.value === 'string' && theme.value.startsWith('custom:')) {
        const customId = theme.value.replace('custom:', '')
        await loadCustomThemeCSS(customId)
      } else {
        applyTheme(theme.value)
      }
      return
    }

    // Preview custom theme
    if (themeId.startsWith('custom:')) {
      const customId = themeId.replace('custom:', '')
      await loadCustomThemeCSS(customId)
      document.documentElement.setAttribute('data-custom-theme', customId)
      document.documentElement.classList.remove('dark')
      document.documentElement.removeAttribute('data-theme')
    } else if (themeId === 'system') {
      // Preview system theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
      document.documentElement.removeAttribute('data-custom-theme')
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      // Preview built-in theme (including variants)
      const isDark = themeId.startsWith('dark') || themeId === 'deepdark'
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.removeAttribute('data-custom-theme')
      
      // Set theme data attribute for variant themes
      if (themeId.includes('-') || themeId === 'deepdark') {
        document.documentElement.setAttribute('data-theme', themeId)
      } else {
        document.documentElement.removeAttribute('data-theme')
      }
    }
  }

  // Get all available themes (built-in + custom)
  const allThemes = computed(() => {
    const builtIn = [
      { id: 'light', name: 'Light', variant: 'light', description: 'Neutral gray light theme' },
      { id: 'light-1', name: 'Warm Light', variant: 'light', description: 'Cream and beige tones' },
      { id: 'light-2', name: 'Rose Light', variant: 'light', description: 'Soft pink tones' },
      { id: 'light-3', name: 'Sky Light', variant: 'light', description: 'Cool blue tones' },
      { id: 'dark', name: 'Dark', variant: 'dark', description: 'Neutral gray dark theme' },
      { id: 'dark-1', name: 'Amber Dark', variant: 'dark', description: 'Warm brown tones' },
      { id: 'dark-2', name: 'Ocean Dark', variant: 'dark', description: 'Blue ocean tones' },
      { id: 'dark-3', name: 'Violet Dark', variant: 'dark', description: 'Purple violet tones' },
      { id: 'deepdark', name: 'Deep Dark', variant: 'dark', description: 'Pure black background' },
      { id: 'system', name: 'System', variant: 'system', description: 'Follow system preference' },
    ]
    const custom = customThemes.value.map(t => ({
      id: `custom:${t.id}`,
      name: t.name,
      isCustom: true,
      variant: 'custom' as const,
      description: 'Custom theme',
    }))
    return [...builtIn, ...custom]
  })
  
  // Get actual theme (resolves 'system' to light/dark)
  const getActualTheme = (): 'light' | 'dark' => {
    if (theme.value === 'system') {
      if (typeof window === 'undefined') return 'light'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    // Return base theme (light or dark) for variants
    if (typeof theme.value === 'string' && (theme.value.startsWith('dark') || theme.value === 'deepdark')) {
      return 'dark'
    }
    if (typeof theme.value === 'string' && theme.value.startsWith('light')) {
      return 'light'
    }
    return theme.value as 'light' | 'dark'
  }

  // Apply theme to document
  const applyTheme = async (themeValue: Theme) => {
    if (typeof document === 'undefined') return

    // Clear preview
    previewThemeId.value = null

    // Handle custom themes
    if (typeof themeValue === 'string' && themeValue.startsWith('custom:')) {
      const customId = themeValue.replace('custom:', '')
      const loaded = await loadCustomThemeCSS(customId)
      if (!loaded) {
        console.error(`Failed to load custom theme: ${customId}`)
        // Fallback to system
        themeValue = 'system'
      } else {
        // Remove dark class and theme attributes for custom themes
        document.documentElement.classList.remove('dark')
        document.documentElement.removeAttribute('data-theme')
        // Add custom theme class
        document.documentElement.setAttribute('data-custom-theme', customId)
        return
      }
    }

    // Remove custom theme attribute
    document.documentElement.removeAttribute('data-custom-theme')

    // Handle built-in themes
    if (themeValue === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const systemTheme = prefersDark ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', prefersDark)
      document.documentElement.setAttribute('data-theme', systemTheme)
      return
    }

    // Handle theme variants
    const isDark = themeValue.startsWith('dark') || themeValue === 'deepdark'
    document.documentElement.classList.toggle('dark', isDark)
    
    // Set theme data attribute for variant themes
    if (themeValue.includes('-') || themeValue === 'deepdark') {
      document.documentElement.setAttribute('data-theme', themeValue)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  // Set theme
  const setTheme = (themeValue: Theme) => {
    theme.value = themeValue
    // Watch will handle applying theme and saving to localStorage
  }

  // Initialize custom themes on store creation
  loadCustomThemes()

  // Initialize theme on store creation
  // Load custom theme if active
  if (theme.value && typeof theme.value === 'string' && theme.value.startsWith('custom:')) {
    const customId = theme.value.replace('custom:', '')
    loadCustomThemeCSS(customId).then(() => {
      applyTheme(theme.value)
    })
  } else {
    // Apply theme immediately (synchronous for built-in themes)
    applyTheme(theme.value)
  }
  
  // Listen to system theme changes if using 'system'
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  }

  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    const initialTheme = getInitialTheme()
    if (theme.value !== initialTheme) {
      theme.value = initialTheme
      // Watch will handle applying theme and saving to localStorage
    } else {
      // If theme is already correct, just ensure it's applied
      applyTheme(initialTheme)
    }
  }

  // Toggle theme (for backward compatibility)
  const toggleTheme = () => {
    const current = theme.value
    if (typeof current === 'string' && current.startsWith('light')) {
      // Switch to corresponding dark theme
      if (current === 'light') theme.value = 'dark'
      else if (current === 'light-1') theme.value = 'dark-1'
      else if (current === 'light-2') theme.value = 'dark-2'
      else if (current === 'light-3') theme.value = 'dark-3'
      else theme.value = 'dark'
    } else if (typeof current === 'string' && (current.startsWith('dark') || current === 'deepdark')) {
      // Switch to corresponding light theme
      if (current === 'dark') theme.value = 'light'
      else if (current === 'dark-1') theme.value = 'light-1'
      else if (current === 'dark-2') theme.value = 'light-2'
      else if (current === 'dark-3') theme.value = 'light-3'
      else if (current === 'deepdark') theme.value = 'light'
      else theme.value = 'light'
    } else {
      // If system or custom, toggle to opposite of current system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'light' : 'dark'
    }
    // Watch will handle applying theme and saving to localStorage
  }

  // Watch theme changes and save to localStorage
  watch(theme, (newTheme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
    
    // Re-apply accent color when theme changes
    if (typeof window !== 'undefined') {
      import('@/stores/settings').then(({ useSettingsStore }) => {
        const settingsStore = useSettingsStore()
        settingsStore.reapplyAccentColor()
      })
    }
  })

  return {
    theme,
    customThemes: computed(() => customThemes.value),
    allThemes,
    previewThemeId: computed(() => previewThemeId.value),
    getActualTheme,
    initTheme,
    toggleTheme,
    setTheme,
    addCustomTheme,
    removeCustomTheme,
    previewTheme,
    loadCustomThemeCSS,
    unloadCustomThemeCSS,
  }
})

