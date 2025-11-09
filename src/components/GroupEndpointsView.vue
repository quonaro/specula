<template>
  <div class="h-full overflow-auto p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Group header -->
      <div class="space-y-2">
        <h1 class="text-2xl font-bold text-foreground">
          {{ groupNode.name }}
        </h1>
        <p v-if="groupNode.fullPath" class="text-sm text-muted-foreground">
          {{ groupNode.fullPath }}
        </p>
      </div>

      <!-- Endpoints list -->
      <div v-if="allEndpoints.length > 0" class="space-y-3">
        <h2 class="text-lg font-semibold text-foreground">
          Endpoints ({{ allEndpoints.length }})
        </h2>
        <div class="grid gap-3">
          <div
            v-for="(endpoint, index) in allEndpoints"
            :key="`${endpoint.method}-${endpoint.path}-${index}`"
            :class="[
              'flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors',
              isSelected(endpoint.method, endpoint.path)
                ? 'border-primary bg-primary/5'
                : ''
            ]"
            @click="handleEndpointClick(endpoint.method, endpoint.path)"
          >
            <span
              :class="[
                'text-xs font-bold px-2.5 py-1 rounded text-white shrink-0',
                getMethodColorClass(endpoint.method)
              ]"
            >
              {{ endpoint.method }}
            </span>
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium text-foreground truncate flex items-center gap-2"
                :title="endpoint.path"
              >
                {{ endpoint.path }}
                <div
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="isEndpointPrivate(endpoint) ? 'bg-red-500' : 'bg-green-500'"
                ></div>
              </div>
              <div v-if="endpoint.operation.summary" class="text-xs text-muted-foreground mt-1">
                {{ endpoint.operation.summary }}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                @click.stop="toggleFavorite(endpoint)"
                class="p-1 hover:bg-accent rounded transition-colors"
                :title="isEndpointFavorite(endpoint) ? 'Remove from favorites' : 'Add to favorites'"
              >
                <Star
                  :class="[
                    'w-4 h-4 transition-colors',
                    isEndpointFavorite(endpoint)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-400'
                  ]"
                />
              </button>
              <span
                v-if="endpoint.operation.deprecated"
                class="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive"
              >
                Deprecated
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="flex items-center justify-center py-12">
        <div class="text-center space-y-2">
          <p class="text-lg font-medium text-foreground">
            No endpoints
          </p>
          <p class="text-sm text-muted-foreground">
            This group has no available endpoints
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Star } from 'lucide-vue-next'
import type { TagNode } from '@/types/openapi'
import Badge from './ui/Badge.vue'
import { isOperationPrivate } from '@/utils/openapi-parser'
import { useSpecStore } from '@/stores/spec'
import { useEndpointFavoritesStore } from '@/stores/endpointFavorites'
import { useSpecCacheStore } from '@/stores/specCache'
import { useToast } from '@/composables/useToast'

interface Props {
  groupNode: TagNode
  selectedOperation: { method: string; path: string } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'selectOperation', method: string, path: string): void
}>()

// Function to recursively collect all endpoints from the group and its subgroups
function collectAllEndpoints(node: TagNode): Array<{
  method: string
  path: string
  operation: any
}> {
  const endpoints: Array<{
    method: string
    path: string
    operation: any
  }> = []

  // Add endpoints from the current node
  endpoints.push(...node.operations)

  // Recursively collect endpoints from child nodes
  node.children.forEach((child) => {
    endpoints.push(...collectAllEndpoints(child))
  })

  return endpoints
}

const allEndpoints = computed(() => {
  const endpoints = collectAllEndpoints(props.groupNode)
  // Sort: favorites first
  return endpoints.sort((a, b) => {
    const aIsFavorite = isEndpointFavorite(a)
    const bIsFavorite = isEndpointFavorite(b)
    
    // Favorites first
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // If both are favorites or both are not, maintain original order
    return 0
  })
})

const isSelected = (method: string, path: string) => {
  return props.selectedOperation?.method === method && props.selectedOperation?.path === path
}

const getMethodColorClass = (method: string) => {
  const colorMap: Record<string, string> = {
    GET: 'bg-method-get',
    POST: 'bg-method-post',
    PUT: 'bg-method-put',
    DELETE: 'bg-method-delete',
    PATCH: 'bg-method-patch',
    OPTIONS: 'bg-method-options',
    HEAD: 'bg-method-head',
    TRACE: 'bg-method-trace',
  }
  return colorMap[method.toUpperCase()] || 'bg-muted'
}

const handleEndpointClick = (method: string, path: string) => {
  emit('selectOperation', method, path)
}

const specStore = useSpecStore()
const endpointFavoritesStore = useEndpointFavoritesStore()
const specCacheStore = useSpecCacheStore()
const { toast } = useToast()

// Get spec identifier (hash or sourceUrl) for an endpoint
const getSpecIdentifier = (endpoint: {
  method: string
  path: string
  operation: any
}) => {
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[endpoint.path]
    if (pathItem) {
      const operation = pathItem[endpoint.method.toLowerCase() as keyof typeof pathItem]
      if (operation) {
        // Try to find hash in cache
        const cachedSpecs = Array.from(specCacheStore.cache.values())
        const cached = cachedSpecs.find(c => 
          JSON.stringify(c.spec) === JSON.stringify(specWithSource.spec)
        )
        if (cached) {
          return { specHash: cached.hash, sourceUrl: specWithSource.sourceUrl, specTitle: specWithSource.title }
        }
        return { sourceUrl: specWithSource.sourceUrl, specTitle: specWithSource.title }
      }
    }
  }
  return { specTitle: 'Unknown' }
}

// Check if endpoint is private
const isEndpointPrivate = (endpoint: {
  method: string
  path: string
  operation: any
}) => {
  // Find the spec that contains this operation
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[endpoint.path]
    if (pathItem) {
      const operation = pathItem[endpoint.method.toLowerCase() as keyof typeof pathItem]
      if (operation) {
        // Use operation from pathItem to ensure we have the correct object
        return isOperationPrivate(operation, pathItem, specWithSource.spec)
      }
    }
  }
  return false
}

// Check if endpoint is favorite
const isEndpointFavorite = (endpoint: {
  method: string
  path: string
  operation: any
}) => {
  const identifier = getSpecIdentifier(endpoint)
  return endpointFavoritesStore.isFavorite(
    endpoint.method,
    endpoint.path,
    identifier.specHash,
    identifier.sourceUrl
  )
}

// Toggle favorite status
const toggleFavorite = (endpoint: {
  method: string
  path: string
  operation: any
}) => {
  const identifier = getSpecIdentifier(endpoint)
  const isFavorite = isEndpointFavorite(endpoint)
  
  if (isFavorite) {
    endpointFavoritesStore.removeFromFavorites(
      endpoint.method,
      endpoint.path,
      identifier.specHash,
      identifier.sourceUrl
    )
    toast({
      title: 'Removed from favorites',
      description: `${endpoint.method} ${endpoint.path}`,
    })
  } else {
    endpointFavoritesStore.addToFavorites(
      endpoint.method,
      endpoint.path,
      identifier.specHash,
      identifier.sourceUrl,
      identifier.specTitle,
      endpoint.operation.summary
    )
    toast({
      title: 'Added to favorites',
      description: `${endpoint.method} ${endpoint.path}`,
    })
  }
}
</script>

