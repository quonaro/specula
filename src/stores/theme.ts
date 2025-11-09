import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      return savedTheme
    }
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  const theme = ref<'light' | 'dark'>(getInitialTheme())

  // Apply theme to document
  const applyTheme = (themeValue: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', themeValue === 'dark')
    }
  }

  // Initialize theme on store creation
  applyTheme(theme.value)

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

  // Toggle theme
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    // Watch will handle applying theme and saving to localStorage
  }

  // Watch theme changes and save to localStorage
  watch(theme, (newTheme) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
    applyTheme(newTheme)
  })

  return {
    theme,
    initTheme,
    toggleTheme,
  }
})

