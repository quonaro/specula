<template>
  <div :class="cn('relative overflow-hidden', className)">
    <div class="h-full w-full rounded-[inherit] overflow-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: '',
})
</script>

