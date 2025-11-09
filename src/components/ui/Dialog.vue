<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50" />
        
        <!-- Dialog -->
        <div
          class="relative z-10 bg-card border border-border rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <div v-if="$slots.header || title" class="flex items-center justify-between p-6 border-b border-border">
            <slot name="header">
              <h2 v-if="title" class="text-lg font-semibold text-foreground">
                {{ title }}
              </h2>
            </slot>
            <button
              v-if="showCloseButton"
              @click="handleClose"
              class="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <slot />
          </div>
          
          <!-- Footer -->
          <div v-if="$slots.footer" class="border-t border-border p-6">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  modelValue: boolean
  title?: string
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCloseButton: true,
  closeOnBackdrop: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    handleClose()
  }
}
</script>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-active > div:last-child,
.dialog-leave-active > div:last-child {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.dialog-enter-from > div:last-child,
.dialog-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>

