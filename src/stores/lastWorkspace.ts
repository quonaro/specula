import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SpecWithSource } from './spec'
import { useSpecCacheStore } from './specCache'

const STORAGE_KEY = 'lastWorkspace'

export interface LastWorkspaceItem {
  identifier: string // hash or sourceUrl
  title: string
}

export const useLastWorkspaceStore = defineStore('lastWorkspace', () => {
  const lastWorkspace = ref<LastWorkspaceItem[]>([])

  // Load last workspace from localStorage
  const loadLastWorkspace = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as LastWorkspaceItem[]
        lastWorkspace.value = parsed
      }
    } catch (error) {
      console.error('Failed to load last workspace:', error)
      lastWorkspace.value = []
    }
  }

  // Save last workspace to localStorage
  const saveLastWorkspace = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lastWorkspace.value))
    } catch (error) {
      console.error('Failed to save last workspace:', error)
    }
  }

  // Save current workspace from specs
  const saveWorkspace = (specs: SpecWithSource[]) => {
    const specCacheStore = useSpecCacheStore()
    const workspaceItems: LastWorkspaceItem[] = specs.map(spec => {
      let identifier: string
      
      if (spec.sourceUrl) {
        // Use sourceUrl if available
        identifier = spec.sourceUrl
      } else {
        // Try to find hash in cache
        const cachedSpecs = Array.from(specCacheStore.cache.values())
        const cached = cachedSpecs.find(c => 
          JSON.stringify(c.spec) === JSON.stringify(spec.spec)
        )
        if (cached) {
          identifier = cached.hash
        } else {
          // If not in cache, add it and use the new hash
          identifier = specCacheStore.addToCache(spec.spec)
        }
      }
      
      return {
        identifier,
        title: spec.title,
      }
    })
    
    lastWorkspace.value = workspaceItems
    saveLastWorkspace()
  }

  // Clear last workspace
  const clearLastWorkspace = () => {
    lastWorkspace.value = []
    saveLastWorkspace()
  }

  // Check if last workspace exists
  const hasLastWorkspace = () => {
    return lastWorkspace.value.length > 0
  }

  // Initialize on store creation
  loadLastWorkspace()

  return {
    lastWorkspace,
    saveWorkspace,
    loadLastWorkspace,
    clearLastWorkspace,
    hasLastWorkspace,
  }
})

