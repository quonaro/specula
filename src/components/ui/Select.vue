<template>
  <select
    :value="modelValue"
    :class="cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
      className
    )"
    @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    v-bind="$attrs"
  >
    <slot />
  </select>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  className?: string
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  className: '',
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

