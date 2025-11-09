<template>
  <div :class="cn('w-full', className)">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  className: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

provide('tabsValue', computed(() => props.modelValue))
provide('tabsUpdate', (value: string) => {
  emit('update:modelValue', value)
})
</script>


