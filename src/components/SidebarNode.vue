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
        v-for="op in node.operations"
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
        <span class="text-sm truncate text-sidebar-foreground">
          {{ op.path }}
        </span>
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
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, ChevronDown } from 'lucide-vue-next'
import type { TagNode } from '@/types/openapi'

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
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.node.fullPath))
const hasChildren = computed(() => props.node.children.size > 0)
const hasOperations = computed(() => props.node.operations.length > 0)
const nodeChildren = computed(() => Array.from(props.node.children.values()))

const handleClick = () => {
  if (hasChildren.value || hasOperations.value) {
    emit('toggleNode', props.node.fullPath)
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
</script>

