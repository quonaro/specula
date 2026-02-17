import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type AccentColor =
  | 'purple'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'pink'
  | 'cyan'
  | 'yellow'
  | 'indigo'
  | 'teal'

interface AccentColorConfig {
  light: string // HSL values
  dark: string
}

const accentColorMap: Record<AccentColor, AccentColorConfig> = {
  purple: { light: '262 83% 58%', dark: '262 83% 58%' },
  blue: { light: '217 91% 60%', dark: '217 91% 70%' },
  green: { light: '142 76% 36%', dark: '142 76% 46%' },
  orange: { light: '25 95% 53%', dark: '25 95% 63%' },
  red: { light: '0 84% 60%', dark: '0 84% 70%' },
  pink: { light: '330 81% 60%', dark: '330 81% 70%' },
  cyan: { light: '199 89% 48%', dark: '199 89% 58%' },
  yellow: { light: '45 93% 47%', dark: '45 93% 57%' },
  indigo: { light: '239 84% 67%', dark: '239 84% 77%' },
  teal: { light: '173 80% 40%', dark: '173 80% 50%' },
}

export const useSettingsStore = defineStore('settings', () => {
  // Get initial accent color from localStorage
  const getInitialAccentColor = (): AccentColor => {
    if (typeof window === 'undefined') return 'purple'
    const saved = localStorage.getItem('accentColor') as AccentColor | null
    return saved && saved in accentColorMap ? saved : 'purple'
  }

  const accentColor = ref<AccentColor>(getInitialAccentColor())

  // Get or create style element for accent colors
  const getAccentStyleElement = (): HTMLStyleElement => {
    let styleEl = document.getElementById('accent-color-styles') as HTMLStyleElement
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'accent-color-styles'
      document.head.appendChild(styleEl)
    }
    return styleEl
  }

  // Apply accent color to CSS variables
  const applyAccentColor = (color: AccentColor) => {
    if (typeof document === 'undefined') return

    const config = accentColorMap[color]
    const root = document.documentElement

    // Apply light theme colors
    root.style.setProperty('--primary', config.light)
    root.style.setProperty('--accent', config.light)
    root.style.setProperty('--ring', config.light)
    root.style.setProperty('--sidebar-primary', config.light)
    root.style.setProperty('--sidebar-ring', config.light)

    // Apply dark theme colors via style element
    const styleEl = getAccentStyleElement()
    styleEl.textContent = `
      .dark {
        --primary: ${config.dark};
        --accent: ${config.dark};
        --ring: ${config.dark};
        --sidebar-primary: ${config.dark};
        --sidebar-ring: ${config.dark};
      }
    `

    // Store color config
    root.setAttribute('data-accent-color', color)
  }

  // Re-apply accent color when theme changes
  const reapplyAccentColor = () => {
    applyAccentColor(accentColor.value)
  }

  // Set accent color
  const setAccentColor = (color: AccentColor) => {
    accentColor.value = color
    // Watch will handle applying and saving
  }

  // Initialize accent color on store creation
  applyAccentColor(accentColor.value)

  // Watch accent color changes and save to localStorage
  watch(accentColor, (newColor) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accentColor', newColor)
    }
    applyAccentColor(newColor)
  })

  // Server URL preferences
  const customServerUrl = ref('')
  const preferredServerType = ref<'custom' | 'current-host' | 'spec' | null>(null)

  // History cleaning preferences
  const autoClearHistory = ref(false)
  const clearHistoryInterval = ref('1h')

  // Initialize from localStorage
  if (typeof window !== 'undefined') {
    const savedAutoClear = localStorage.getItem('autoClearHistory')
    if (savedAutoClear !== null) autoClearHistory.value = savedAutoClear === 'true'

    const savedInterval = localStorage.getItem('clearHistoryInterval')
    if (savedInterval) clearHistoryInterval.value = savedInterval

    const savedCustomUrl = localStorage.getItem('customServerUrl')
    if (savedCustomUrl) customServerUrl.value = savedCustomUrl

    const savedPreferredType = localStorage.getItem('preferredServerType') as any
    if (['custom', 'current-host', 'spec'].includes(savedPreferredType)) {
      preferredServerType.value = savedPreferredType
    }
  }

  // Save history cleaning preferences
  watch(autoClearHistory, (newValue) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('autoClearHistory', newValue.toString())
    }
  })

  watch(clearHistoryInterval, (newValue) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('clearHistoryInterval', newValue)
    }
  })

  // Save server preferences
  watch(customServerUrl, (newValue) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('customServerUrl', newValue)
    }
  })

  watch(preferredServerType, (newValue) => {
    if (typeof localStorage !== 'undefined') {
      if (newValue) {
        localStorage.setItem('preferredServerType', newValue)
      } else {
        localStorage.removeItem('preferredServerType')
      }
    }
  })

  const setServerPreference = (type: 'custom' | 'current-host' | 'spec', url?: string) => {
    preferredServerType.value = type
    if (url !== undefined && type === 'custom') {
      customServerUrl.value = url
    }
  }

  return {
    accentColor,
    setAccentColor,
    reapplyAccentColor,
    customServerUrl,
    preferredServerType,
    setServerPreference,
    autoClearHistory,
    clearHistoryInterval
  }
})

