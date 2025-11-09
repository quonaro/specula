<template>
  <div
    v-show="isActive"
    :class="cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)"
  >
    <slot />
  </div>
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

const isActive = computed(() => tabsValue === props.value)
</script>

