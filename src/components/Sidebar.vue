<template>
  <div class="w-80 border-r border-sidebar-border bg-sidebar h-screen flex flex-col">
    <div class="p-4 border-b border-sidebar-border">
      <div class="flex items-center gap-2 mb-3">
        <img src="/logo.png" alt="Logo" class="h-8 logo-image" />
        <span class="text-lg font-semibold text-sidebar-foreground">Specula</span>
      </div>
      <div class="relative mb-2">
        <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="Search endpoints..."
          class="pl-8 h-9 text-sm"
        />
      </div>
      
      <!-- Filters - Collapsible -->
      <div class="border-t border-sidebar-border pt-2">
        <button
          @click="filtersExpanded = !filtersExpanded"
          class="w-full flex items-center justify-between py-1.5 text-xs font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <span>Filters</span>
          <ChevronDown
            :class="['h-3.5 w-3.5 transition-transform duration-200', filtersExpanded ? 'rotate-180' : '']"
          />
        </button>
        
        <div v-show="filtersExpanded" class="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <!-- Security Filter -->
          <select
            v-model="securityFilter"
            class="w-full h-8 rounded-md border border-sidebar-border bg-sidebar px-2 text-xs text-sidebar-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All security</option>
            <option value="private">Protected only</option>
            <option value="public">Public only</option>
          </select>
          
          <!-- Method Filter -->
          <div class="flex flex-wrap gap-1">
            <button
              v-for="method in availableMethods"
              :key="method"
              :class="[
                'px-1.5 py-0.5 text-xs font-bold rounded transition-all text-white',
                selectedMethods.has(method)
                  ? getMethodColorClass(method)
                  : `${getMethodColorClass(method)} opacity-50 hover:opacity-75`
              ]"
              @click="toggleMethod(method)"
            >
              {{ method }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <ScrollArea class="flex-1">
      <div class="p-2">
        <div v-if="root.name === 'root'">
          <div
            v-for="child in filteredRootChildren"
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
          <div v-if="(searchQuery || securityFilter !== 'all' || selectedMethods.size < availableMethods.length) && filteredRootChildren.length === 0" class="p-4 text-center text-sm text-muted-foreground">
            No results found
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, ChevronDown } from 'lucide-vue-next'
import type { TagNode } from '@/types/openapi'
import ScrollArea from './ui/ScrollArea.vue'
import SidebarNode from './SidebarNode.vue'
import Input from './ui/Input.vue'
import { filterTagNodeTree } from '@/utils/search'
import { filterTagNodeBySecurityAndMethods } from '@/utils/filter'
import { useSpecStore } from '@/stores/spec'
import { storeToRefs } from 'pinia'
import { getMethodColorClass } from '@/utils/operation-cache'

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
const searchQuery = ref('')
const filtersExpanded = ref(false)
const securityFilter = ref<'all' | 'private' | 'public'>('all')
const selectedMethods = ref<Set<string>>(new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']))

const specStore = useSpecStore()
const { specs } = storeToRefs(specStore)

const availableMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

const toggleMethod = (method: string) => {
  const newSet = new Set(selectedMethods.value)
  if (newSet.has(method)) {
    newSet.delete(method)
  } else {
    newSet.add(method)
  }
  selectedMethods.value = newSet
}

// Memoize rootChildren - only recalculate when root.children changes
const rootChildren = computed(() => {
  const children = props.root.children
  return Array.from(children.values())
})

// Filter root children based on search query, security, and methods
const filteredRootChildren = computed(() => {
  let filtered: TagNode[] = rootChildren.value
  
  // Apply search filter
  if (searchQuery.value.trim()) {
    const searchFiltered: TagNode[] = []
    for (const child of filtered) {
      const filteredChild = filterTagNodeTree(child, searchQuery.value)
      if (filteredChild && (
        filteredChild.operations.length > 0 ||
        filteredChild.children.size > 0
      )) {
        searchFiltered.push(filteredChild)
        // Auto-expand matching nodes
        if (!expandedNodes.value.has(filteredChild.fullPath)) {
          const newExpanded = new Set(expandedNodes.value)
          newExpanded.add(filteredChild.fullPath)
          expandedNodes.value = newExpanded
        }
      }
    }
    filtered = searchFiltered
  }
  
  // Apply security and method filters
  if (securityFilter.value !== 'all' || selectedMethods.value.size < availableMethods.length) {
    const finalFiltered: TagNode[] = []
    for (const child of filtered) {
      const filteredChild = filterTagNodeBySecurityAndMethods(
        child,
        securityFilter.value,
        selectedMethods.value,
        specs.value
      )
      if (filteredChild && (
        filteredChild.operations.length > 0 ||
        filteredChild.children.size > 0
      )) {
        finalFiltered.push(filteredChild)
      }
    }
    filtered = finalFiltered
  }
  
  return filtered
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

