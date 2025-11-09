import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBackendStore = defineStore('backend', () => {
  const isAvailable = ref<boolean>(false)
  const isChecking = ref<boolean>(false)
  const backendUrl = ref<string | null>(null)
  const lastCheckTime = ref<number | null>(null)

  const setAvailable = (available: boolean, url: string | null = null) => {
    isAvailable.value = available
    backendUrl.value = url
    lastCheckTime.value = Date.now()
  }

  const setChecking = (checking: boolean) => {
    isChecking.value = checking
  }

  return {
    isAvailable,
    isChecking,
    backendUrl,
    lastCheckTime,
    setAvailable,
    setChecking,
  }
})

