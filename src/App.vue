<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useBackend } from '@/composables/useBackend'
import { useSettingsStore } from '@/stores/settings'
import { useRequestHistoryStore } from '@/stores/requestHistory'

const { checkBackend } = useBackend()
const settingsStore = useSettingsStore()
const historyStore = useRequestHistoryStore()

// Parse time interval string (e.g., "5m", "1h")
const parseTimeInterval = (interval: string): number => {
  const match = interval.match(/^(\d+)([smhdwy])$/i)
  if (!match) return 5 * 60 * 1000

  const value = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000,
  }
  return value * (multipliers[unit] || 5 * 60 * 1000)
}

let cleanupInterval: ReturnType<typeof setInterval> | null = null

const setupCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }

  if (settingsStore.autoClearHistory) {
    const intervalMs = parseTimeInterval(settingsStore.clearHistoryInterval)
    
    const doCleanup = () => {
      const cutoffTime = Date.now() - intervalMs
      historyStore.clearHistoryOlderThan(cutoffTime)
    }

    // Run immediately
    doCleanup()
    
    // Set up interval (check every minute or at interval if shorter)
    cleanupInterval = setInterval(doCleanup, Math.min(intervalMs, 60 * 1000))
  }
}

onMounted(() => {
  // Check backend availability on app start (only if not in standalone mode)
  const isStandalone = typeof window !== 'undefined' && (window as any).__SPECULA_STANDALONE__ === true
  if (!isStandalone) {
    checkBackend().catch(() => {
      // Silently fail - backend is optional
    })
  }

  // Setup initial cleanup
  setupCleanup()

  // Watch for changes in cleanup settings
  watch([() => settingsStore.autoClearHistory, () => settingsStore.clearHistoryInterval], () => {
    setupCleanup()
  })
})
</script>

