<template>
  <button
    :class="cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
      isActive ? 'bg-background text-foreground shadow-sm' : '',
      className
    )"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  className?: string
}

const props = defineProps<Props>()

const tabsValue = inject<string>('tabsValue', '')
const tabsUpdate = inject<(value: string) => void>('tabsUpdate', () => {})

const isActive = computed(() => tabsValue === props.value)

const handleClick = () => {
  tabsUpdate(props.value)
}
</script>

