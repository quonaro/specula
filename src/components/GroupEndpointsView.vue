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
            v-memo="[endpoint.method, endpoint.path, endpoint.isSelected, endpoint.isPrivate]"
            :key="`${endpoint.method}-${endpoint.path}-${index}`"
            :class="[
              'flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors',
              endpoint.itemClass
            ]"
            @click="handleEndpointClick(endpoint.method, endpoint.path)"
          >
            <span
              :class="[
                'text-xs font-bold px-2.5 py-1 rounded text-white shrink-0',
                endpoint.colorClass
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
                  :class="endpoint.privacyClass"
                ></div>
              </div>
              <div v-if="endpoint.operation.summary" class="text-xs text-muted-foreground mt-1">
                {{ endpoint.operation.summary }}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
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
import { storeToRefs } from 'pinia'
import type { TagNode } from '@/types/openapi'
import Badge from './ui/Badge.vue'
import { getMethodColorClass, checkOperationPrivacy } from '@/utils/operation-cache'
import { useSpecStore } from '@/stores/spec'

interface Props {
  groupNode: TagNode
  selectedOperation: { method: string; path: string } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'selectOperation', method: string, path: string): void
}>()

const specStore = useSpecStore()
const { specs } = storeToRefs(specStore)

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

// Pre-compute all endpoints with their metadata to avoid function calls in template
const allEndpoints = computed(() => {
  const endpoints = collectAllEndpoints(props.groupNode)
  const selected = props.selectedOperation
  const selectedMethod = selected?.method
  const selectedPath = selected?.path
  const specsValue = specs.value

  return endpoints.map(endpoint => {
    const isSelected = selectedMethod === endpoint.method && selectedPath === endpoint.path
    const isPrivate = checkOperationPrivacy({ method: endpoint.method, path: endpoint.path }, specsValue)
    
    return {
      ...endpoint,
      isSelected,
      isPrivate,
      colorClass: getMethodColorClass(endpoint.method),
      // Pre-compute class strings
      itemClass: isSelected
        ? 'border-primary bg-primary/5'
        : '',
      privacyClass: isPrivate ? 'bg-red-500' : 'bg-green-500'
    }
  })
})

const handleEndpointClick = (method: string, path: string) => {
  emit('selectOperation', method, path)
}
</script>

