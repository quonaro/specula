import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OpenAPISpec } from '@/types/openapi'

interface CachedSpec {
  hash: string
  spec: OpenAPISpec
  title: string
  timestamp: number
}

const MAX_CACHE_ITEMS = 50
const STORAGE_KEY = 'specCache'

// Generate a 16-character hash (hexadecimal)
function generateHash(): string {
  // Use crypto if available, otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 16)
  } else {
    // Fallback for environments without crypto - generate 16 hex chars
    let hash = ''
    for (let i = 0; i < 16; i++) {
      hash += Math.floor(Math.random() * 16).toString(16)
    }
    return hash
  }
}

// Check if a string is a valid hash (16 hex characters)
export function isHash(str: string): boolean {
  return /^[a-f0-9]{16}$/i.test(str)
}

export const useSpecCacheStore = defineStore('specCache', () => {
  const cache = ref<Map<string, CachedSpec>>(new Map())

  // Load cache from localStorage
  // Optimized: split large arrays into chunks to avoid blocking UI
  const loadCache = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CachedSpec[]
        const cacheMap = new Map<string, CachedSpec>()
        
        // For large arrays, process in chunks to avoid blocking UI
        const CHUNK_SIZE = 50
        if (parsed.length > CHUNK_SIZE) {
          let index = 0
          const processChunk = () => {
            const chunk = parsed.slice(index, index + CHUNK_SIZE)
            chunk.forEach(item => {
              cacheMap.set(item.hash, item)
            })
            index += CHUNK_SIZE
            
            if (index < parsed.length) {
              // Use requestAnimationFrame to allow browser to render between chunks
              requestAnimationFrame(processChunk)
            } else {
              cache.value = cacheMap
            }
          }
          processChunk()
        } else {
          // Small arrays can be processed immediately
          parsed.forEach(item => {
            cacheMap.set(item.hash, item)
          })
          cache.value = cacheMap
        }
      }
    } catch (error) {
      console.error('Failed to load spec cache:', error)
      cache.value = new Map()
    }
  }

  // Save cache to localStorage
  const saveCache = () => {
    try {
      // Get favorite hashes from localStorage to preserve them
      let favoriteHashes = new Set<string>()
      try {
        const favoritesStored = localStorage.getItem('specFavorites')
        if (favoritesStored) {
          const favorites = JSON.parse(favoritesStored) as Array<{ hash: string }>
          favoriteHashes = new Set(favorites.map(f => f.hash))
        }
      } catch (e) {
        // Ignore errors when reading favorites
      }

      // Convert Map to Array
      const allItems = Array.from(cache.value.values())
      
      // Separate favorites and regular items
      const favoriteItems: CachedSpec[] = []
      const regularItems: CachedSpec[] = []
      
      allItems.forEach(item => {
        if (favoriteHashes.has(item.hash)) {
          favoriteItems.push(item)
        } else {
          regularItems.push(item)
        }
      })
      
      // Sort regular items by timestamp and keep only MAX_CACHE_ITEMS most recent
      regularItems.sort((a, b) => b.timestamp - a.timestamp)
      const regularItemsToKeep = regularItems.slice(0, MAX_CACHE_ITEMS)
      
      // Combine favorites (always kept) with regular items
      const items = [...favoriteItems, ...regularItemsToKeep]
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      
      // Update cache to only include saved items
      const cacheMap = new Map<string, CachedSpec>()
      items.forEach(item => {
        cacheMap.set(item.hash, item)
      })
      cache.value = cacheMap
    } catch (error) {
      console.error('Failed to save spec cache:', error)
    }
  }

  // Add spec to cache and return hash
  const addToCache = (spec: OpenAPISpec): string => {
    const hash = generateHash()
    const title = spec.info?.title || 'Untitled Specification'
    
    const cachedSpec: CachedSpec = {
      hash,
      spec,
      title,
      timestamp: Date.now(),
    }

    cache.value.set(hash, cachedSpec)
    saveCache()

    return hash
  }

  // Get spec by hash
  const getByHash = (hash: string): OpenAPISpec | null => {
    const cached = cache.value.get(hash)
    return cached ? cached.spec : null
  }

  // Get cached spec with metadata
  const getCachedSpec = (hash: string): CachedSpec | null => {
    return cache.value.get(hash) || null
  }

  // Remove from cache
  const removeFromCache = (hash: string) => {
    cache.value.delete(hash)
    saveCache()
  }

  // Clear all cache (but preserve favorites)
  const clearCache = () => {
    // Get favorite hashes to preserve them
    let favoriteHashes = new Set<string>()
    try {
      const favoritesStored = localStorage.getItem('specFavorites')
      if (favoritesStored) {
        const favorites = JSON.parse(favoritesStored) as Array<{ hash: string }>
        favoriteHashes = new Set(favorites.map(f => f.hash))
      }
    } catch (e) {
      // Ignore errors when reading favorites
    }

    // Remove only non-favorite items
    const itemsToKeep: CachedSpec[] = []
    cache.value.forEach((item, hash) => {
      if (favoriteHashes.has(hash)) {
        itemsToKeep.push(item)
      }
    })
    
    cache.value.clear()
    itemsToKeep.forEach(item => {
      cache.value.set(item.hash, item)
    })
    
    saveCache()
  }

  // Initialize on store creation
  loadCache()

  return {
    cache,
    addToCache,
    getByHash,
    getCachedSpec,
    removeFromCache,
    clearCache,
    loadCache,
  }
})

