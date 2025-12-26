<template>
  <div 
    ref="columnRef"
    class="relative flex flex-col h-full column-separator"
    :class="{ 'last-separator': isLast }"
    :style="{ 
      width: `${width}%`, 
      minWidth: `${minWidth}px`
    }"
  >
    <slot />
    <div
      v-if="resizable && !isLast"
      ref="resizeHandleRef"
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors z-10"
      @mousedown="startResize"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Props {
  width: number // percentage
  minWidth?: number
  resizable?: boolean
  isLast?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  minWidth: 200,
  resizable: true,
  isLast: false
})

const emit = defineEmits<{
  resize: [delta: number]
}>()

const columnRef = ref<HTMLElement | null>(null)
const resizeHandleRef = ref<HTMLElement | null>(null)
const isResizing = ref(false)
const lastX = ref(0)

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  lastX.value = e.clientX // Store initial mouse position
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

// Use requestAnimationFrame for smooth resizing
let rafId: number | null = null
let pendingDelta = 0

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value || !columnRef.value) return
  
  // Calculate delta from last position (incremental, not cumulative)
  const currentX = e.clientX
  const delta = currentX - lastX.value
  lastX.value = currentX // Update last position for next move
  
  // Cancel previous animation frame if exists
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  
  // Accumulate delta for this frame
  pendingDelta += delta
  
  // Schedule update on next animation frame
  rafId = requestAnimationFrame(() => {
    // Only emit if there's actual movement
    if (Math.abs(pendingDelta) > 0) {
      emit('resize', pendingDelta)
      pendingDelta = 0 // Reset after emit
    }
    
    rafId = null
  })
}

const stopResize = () => {
  isResizing.value = false
  
  // Cancel any pending animation frame
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style scoped>
.column-separator::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0.5px;
  background-color: hsl(var(--border));
  pointer-events: none;
}

.column-separator::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 0.5px;
  background-color: hsl(var(--border));
  pointer-events: none;
}

.column-separator.last-separator::after {
  display: none;
}
</style>

