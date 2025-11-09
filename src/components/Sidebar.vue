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
          <div v-for="child in rootChildren" :key="child.fullPath">
            <SidebarNode
              :node="child"
              :level="0"
              :expanded-nodes="expandedNodes"
              :selected-operation="selectedOperation"
              @toggle-node="toggleNode"
              @select-operation="onOperationSelect"
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
}>()

const expandedNodes = ref<Set<string>>(new Set())

const rootChildren = computed(() => {
  return Array.from(props.root.children.values())
})

onMounted(() => {
  const saved = localStorage.getItem('expandedNodes')
  if (saved) {
    expandedNodes.value = new Set(JSON.parse(saved))
  }
})

watch(expandedNodes, (newVal) => {
  localStorage.setItem('expandedNodes', JSON.stringify(Array.from(newVal)))
}, { deep: true })

const toggleNode = (fullPath: string) => {
  const newExpanded = new Set(expandedNodes.value)
  if (newExpanded.has(fullPath)) {
    newExpanded.delete(fullPath)
  } else {
    newExpanded.add(fullPath)
  }
  expandedNodes.value = newExpanded
}

const onOperationSelect = (method: string, path: string) => {
  emit('operationSelect', method, path)
}
</script>

