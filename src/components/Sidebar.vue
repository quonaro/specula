<template>
  <div class="w-80 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
    <div class="p-4 border-b border-sidebar-border">
      <div class="flex items-center gap-2">
        <img src="/logo.png" alt="Logo" class="h-8 logo-image" />
        <span class="text-lg font-semibold text-sidebar-foreground">Specula</span>
      </div>
    </div>
    <ScrollArea class="flex-1">
      <div class="p-2">
        <div v-if="root.name === 'root'">
          <div
            v-for="child in rootChildren"
            :key="child.fullPath"
          >
            <SidebarNode
              :node="child"
              :level="0"
              :expanded-nodes="expandedNodes"
              :selected-operation="selectedOperation"
              @toggle-node="toggleNode"
              @select-operation="onOperationSelect"
              @select-group="onGroupSelect"
            />
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { TagNode } from '@/types/openapi'
import ScrollArea from './ui/ScrollArea.vue'
import SidebarNode from './SidebarNode.vue'

interface Props {
  root: TagNode
  selectedOperation: { method: string; path: string } | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'operationSelect', method: string, path: string): void
  (e: 'groupSelect', node: TagNode): void
}>()

const expandedNodes = ref<Set<string>>(new Set())

// Memoize rootChildren - only recalculate when root.children changes
const rootChildren = computed(() => {
  const children = props.root.children
  return Array.from(children.values())
})

onMounted(() => {
  const saved = localStorage.getItem('expandedNodes')
  if (saved) {
    expandedNodes.value = new Set(JSON.parse(saved))
  }
})

// Watch Set changes with debounced save to avoid excessive localStorage writes
// Track both size and a serialized version to catch content changes
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const saveToLocalStorage = () => {
  localStorage.setItem('expandedNodes', JSON.stringify(Array.from(expandedNodes.value)))
}

watch(() => {
  // Create a serialized version to track content changes, not just size
  return Array.from(expandedNodes.value).sort().join(',')
}, () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(saveToLocalStorage, 300) // Debounce: save 300ms after last change
}, { flush: 'post' })

const toggleNode = (fullPath: string) => {
  // Create a completely new Set to ensure Vue reactivity detects the change
  // This is critical - Vue needs a new reference to detect Set changes
  const current = expandedNodes.value
  const newExpanded = new Set<string>()
  
  // Copy all existing items
  current.forEach(item => newExpanded.add(item))
  
  // Toggle the specific item
  if (newExpanded.has(fullPath)) {
    newExpanded.delete(fullPath)
  } else {
    newExpanded.add(fullPath)
  }
  
  // Assign new Set - Vue will detect the reference change
  expandedNodes.value = newExpanded
}

const onOperationSelect = (method: string, path: string) => {
  emit('operationSelect', method, path)
}

const onGroupSelect = (node: TagNode) => {
  emit('groupSelect', node)
}
</script>

