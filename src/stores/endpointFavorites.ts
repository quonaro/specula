import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface FavoriteEndpoint {
  id: string // Unique identifier: method:path:specHash or method:path:sourceUrl
  method: string
  path: string
  specHash?: string
  sourceUrl?: string
  specTitle?: string
  operationSummary?: string
  timestamp: number
}

const STORAGE_KEY = 'endpointFavorites'

// Generate unique ID for endpoint
function generateEndpointId(
  method: string,
  path: string,
  specHash?: string,
  sourceUrl?: string
): string {
  const identifier = specHash || sourceUrl || 'unknown'
  return `${method.toUpperCase()}:${path}:${identifier}`
}

export const useEndpointFavoritesStore = defineStore('endpointFavorites', () => {
  const favorites = ref<Map<string, FavoriteEndpoint>>(new Map())

  // Load favorites from localStorage
  const loadFavorites = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as FavoriteEndpoint[]
        const favoritesMap = new Map<string, FavoriteEndpoint>()
        parsed.forEach(item => {
          favoritesMap.set(item.id, item)
        })
        favorites.value = favoritesMap
      }
    } catch (error) {
      console.error('Failed to load endpoint favorites:', error)
      favorites.value = new Map()
    }
  }

  // Save favorites to localStorage
  const saveFavorites = () => {
    try {
      const items = Array.from(favorites.value.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Failed to save endpoint favorites:', error)
    }
  }

  // Add endpoint to favorites
  const addToFavorites = (
    method: string,
    path: string,
    specHash?: string,
    sourceUrl?: string,
    specTitle?: string,
    operationSummary?: string
  ): string => {
    const id = generateEndpointId(method, path, specHash, sourceUrl)
    
    const favoriteEndpoint: FavoriteEndpoint = {
      id,
      method: method.toUpperCase(),
      path,
      specHash,
      sourceUrl,
      specTitle,
      operationSummary,
      timestamp: Date.now(),
    }

    favorites.value.set(id, favoriteEndpoint)
    saveFavorites()

    return id
  }

  // Remove from favorites
  const removeFromFavorites = (method: string, path: string, specHash?: string, sourceUrl?: string) => {
    const id = generateEndpointId(method, path, specHash, sourceUrl)
    favorites.value.delete(id)
    saveFavorites()
  }

  // Check if endpoint is in favorites
  const isFavorite = (method: string, path: string, specHash?: string, sourceUrl?: string): boolean => {
    const id = generateEndpointId(method, path, specHash, sourceUrl)
    return favorites.value.has(id)
  }

  // Get all favorites
  const getAllFavorites = (): FavoriteEndpoint[] => {
    return Array.from(favorites.value.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  // Clear all favorites
  const clearFavorites = () => {
    favorites.value.clear()
    saveFavorites()
  }

  // Initialize on store creation
  loadFavorites()

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getAllFavorites,
    clearFavorites,
    loadFavorites,
  }
})

