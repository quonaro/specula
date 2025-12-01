import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'system'

export const useThemeStore = defineStore('theme', () => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): Theme => {
    if (typeof window === 'undefined') return 'system'
    
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme
    }
    
    return 'system'
  }

  const theme = ref<Theme>(getInitialTheme())
  
  // Get actual theme (resolves 'system' to light/dark)
  const getActualTheme = (): 'light' | 'dark' => {
    if (theme.value === 'system') {
      if (typeof window === 'undefined') return 'light'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return prefersDark ? 'dark' : 'light'
    }
    return theme.value
  }

  // Apply theme to document
  const applyTheme = (themeValue: Theme) => {
    if (typeof document !== 'undefined') {
      const actualTheme = themeValue === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : themeValue
      document.documentElement.classList.toggle('dark', actualTheme === 'dark')
    }
  }

  // Set theme
  const setTheme = (themeValue: Theme) => {
    theme.value = themeValue
    // Watch will handle applying theme and saving to localStorage
  }

  // Initialize theme on store creation
  applyTheme(theme.value)
  
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
    if (theme.value === 'light') {
      theme.value = 'dark'
    } else if (theme.value === 'dark') {
      theme.value = 'light'
    } else {
      // If system, toggle to opposite of current system preference
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
    getActualTheme,
    initTheme,
    toggleTheme,
    setTheme,
  }
})

