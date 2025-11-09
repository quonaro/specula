<template>
  <div>
    <div
      v-if="node.name !== 'root'"
      class="flex items-center gap-2 px-3 py-2 hover:bg-sidebar-accent rounded-md cursor-pointer transition-colors"
      :style="{ paddingLeft: `${level * 12 + 12}px` }"
      @click="handleClick"
    >
      <div v-if="hasChildren || hasOperations" class="text-sidebar-foreground/70">
        <ChevronDown v-if="isExpanded" class="h-4 w-4" />
        <ChevronRight v-else class="h-4 w-4" />
      </div>
      <div v-else class="w-4" />
      <span class="text-sm font-medium text-sidebar-foreground">
        {{ node.name }}
      </span>
      <span v-if="hasOperations" class="ml-auto text-xs text-muted-foreground">
        {{ node.operations.length }}
      </span>
    </div>

    <div v-if="isExpanded && node.name !== 'root'" class="animate-in slide-in-from-top-2 duration-200">
      <!-- Render operations -->
      <div
        v-for="op in sortedOperations"
        :key="`${op.method}-${op.path}`"
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
          isSelected(op.method, op.path)
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-sidebar-accent'
        ]"
        :style="{ paddingLeft: `${(level + 1) * 12 + 12}px` }"
        @click="$emit('selectOperation', op.method, op.path)"
      >
        <span
          :class="[
            'text-xs font-bold px-2 py-0.5 rounded text-white',
            getMethodColorClass(op.method)
          ]"
        >
          {{ op.method }}
        </span>
        <span
          class="text-sm truncate text-sidebar-foreground flex-1"
          :title="op.path"
        >
          {{ op.path }}
        </span>
        <div
          class="w-2 h-2 rounded-full shrink-0"
          :class="checkIfPrivate(op) ? 'bg-red-500' : 'bg-green-500'"
        ></div>
        <button
          @click.stop="toggleFavorite(op)"
          class="shrink-0 p-1 hover:bg-sidebar-accent rounded transition-colors"
          :title="isEndpointFavorite(op) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <Star
            :class="[
              'w-4 h-4 transition-colors',
              isEndpointFavorite(op)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-sidebar-foreground/50 hover:text-yellow-400'
            ]"
          />
        </button>
      </div>

      <!-- Render child nodes -->
      <div v-for="child in nodeChildren" :key="child.fullPath">
        <SidebarNode
          :node="child"
          :level="level + 1"
          :expanded-nodes="expandedNodes"
          :selected-operation="selectedOperation"
          @toggle-node="(fullPath: string) => emit('toggleNode', fullPath)"
          @select-operation="(method: string, path: string) => emit('selectOperation', method, path)"
          @select-group="(node: TagNode) => emit('selectGroup', node)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, ChevronDown, Star } from 'lucide-vue-next'
import type { TagNode } from '@/types/openapi'
import { isOperationPrivate } from '@/utils/openapi-parser'
import { useSpecStore } from '@/stores/spec'
import { useEndpointFavoritesStore } from '@/stores/endpointFavorites'
import { useSpecCacheStore } from '@/stores/specCache'
import { useToast } from '@/composables/useToast'

interface Props {
  node: TagNode
  level: number
  expandedNodes: Set<string>
  selectedOperation: { method: string; path: string } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'toggleNode', fullPath: string): void
  (e: 'selectOperation', method: string, path: string): void
  (e: 'selectGroup', node: TagNode): void
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.node.fullPath))
const hasChildren = computed(() => props.node.children.size > 0)
const hasOperations = computed(() => props.node.operations.length > 0)
const nodeChildren = computed(() => Array.from(props.node.children.values()))

const specStore = useSpecStore()
const endpointFavoritesStore = useEndpointFavoritesStore()
const specCacheStore = useSpecCacheStore()
const { toast } = useToast()

const handleClick = () => {
  if (hasChildren.value || hasOperations.value) {
    emit('toggleNode', props.node.fullPath)
    // Also emit group selection event
    emit('selectGroup', props.node)
  }
}

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

// Get spec identifier (hash or sourceUrl) for an endpoint
const getSpecIdentifier = (op: { method: string; path: string; operation: any }) => {
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[op.path]
    if (pathItem) {
      const operation = pathItem[op.method.toLowerCase() as keyof typeof pathItem]
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

// Check if operation is private
const checkIfPrivate = (op: { method: string; path: string; operation: any }) => {
  // Find the spec that contains this operation
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[op.path]
    if (pathItem) {
      const operation = pathItem[op.method.toLowerCase() as keyof typeof pathItem]
      if (operation && typeof operation === 'object' && 'responses' in operation) {
        // Use operation from pathItem to ensure we have the correct object
        return isOperationPrivate(operation as any, pathItem, specWithSource.spec)
      }
    }
  }
  return false
}

// Check if endpoint is favorite
const isEndpointFavorite = (op: { method: string; path: string; operation: any }) => {
  const identifier = getSpecIdentifier(op)
  return endpointFavoritesStore.isFavorite(
    op.method,
    op.path,
    identifier.specHash,
    identifier.sourceUrl
  )
}

// Sort operations: favorites first
const sortedOperations = computed(() => {
  const operations = [...props.node.operations]
  return operations.sort((a, b) => {
    const aIsFavorite = isEndpointFavorite(a)
    const bIsFavorite = isEndpointFavorite(b)
    
    // Favorites first
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    
    // If both are favorites or both are not, maintain original order
    return 0
  })
})

// Toggle favorite status
const toggleFavorite = (op: { method: string; path: string; operation: any }) => {
  const identifier = getSpecIdentifier(op)
  const isFavorite = isEndpointFavorite(op)
  
  if (isFavorite) {
    endpointFavoritesStore.removeFromFavorites(
      op.method,
      op.path,
      identifier.specHash,
      identifier.sourceUrl
    )
    toast({
      title: 'Removed from favorites',
      description: `${op.method} ${op.path}`,
    })
  } else {
    endpointFavoritesStore.addToFavorites(
      op.method,
      op.path,
      identifier.specHash,
      identifier.sourceUrl,
      identifier.specTitle,
      op.operation.summary
    )
    toast({
      title: 'Added to favorites',
      description: `${op.method} ${op.path}`,
    })
  }
}
</script>

