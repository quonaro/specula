<template>
  <div class="flex-1 flex flex-col min-h-0" ref="layoutRef">
    <div class="flex-1 flex relative" :style="{ width: '100%', height: '100%' }">
      <ResizableColumn
        v-for="(column, idx) in columns"
        :key="idx"
        :width="columnWidths[idx]"
        :min-width="200"
        :resizable="columnsCount > 1"
        :is-last="idx === columnsCount - 1"
        @resize="(delta) => handleColumnResize(idx, delta)"
      >
        <ScrollArea class="h-full">
          <div>
            <draggable
              v-model="column.cards"
              :group="{ name: 'cards', pull: true, put: true }"
              :animation="200"
              filter="input, textarea, button, select, [contenteditable='true'], .no-drag"
              :prevent-on-filter="false"
              ghost-class="opacity-50"
              drag-class="cursor-grabbing"
              handle=".drag-handle"
              item-key="id"
              @end="handleDragEnd"
            >
              <template #item="{ element: card }">
                <div class="w-full">
                  <div 
                    class="drag-handle cursor-grab active:cursor-grabbing px-4"
                    :class="{ 'pt-4': getCardIndex(column, card.id) === 0 }"
                  >
                    <component
                      :is="getCardComponent(card.type)"
                      v-bind="getCardProps(card.type)"
                      @response="handleCardResponse"
                    />
                  </div>
                  <div 
                    v-if="getCardIndex(column, card.id) < column.cards.length - 1"
                    class="py-4"
                  >
                    <Separator class="w-full" />
                  </div>
                  <div 
                    v-if="getCardIndex(column, card.id) === column.cards.length - 1"
                    class="pb-4"
                  />
                </div>
              </template>
            </draggable>
          </div>
        </ScrollArea>
      </ResizableColumn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import draggable from 'vuedraggable'
import type { Operation, OpenAPISpec, PathItem } from '@/types/openapi'
import ResizableColumn from './ResizableColumn.vue'
import ScrollArea from '../ui/ScrollArea.vue'
import Separator from '../ui/Separator.vue'
import ParametersCard from './ParametersCard.vue'
import RequestBodyCard from './RequestBodyCard.vue'
import ResponsesCard from './ResponsesCard.vue'
import AuthorizationCard from './AuthorizationCard.vue'
import ServerUrlCard from './ServerUrlCard.vue'
import TryItOutCard from './TryItOutCard.vue'
import ResponseCard from './ResponseCard.vue'

export interface CardData {
  id: string
  type: 'parameters' | 'requestBody' | 'responses' | 'authorization' | 'serverUrl' | 'tryItOut' | 'response'
  columnIndex: number
}

interface Column {
  cards: CardData[]
}

interface Props {
  columnsCount: number
  columnWidths: number[]
  cards: CardData[]
  operation: Operation
  spec: OpenAPISpec
  path: string
  method: string
  pathItem?: PathItem
  sourceUrl?: string
  serverUrl?: string
  authorizationCredentials?: Record<string, string>
  initialParameters?: Record<string, any>
  initialRequestBody?: any
  response?: any
  onResponse?: (response: any) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:cards': [cards: CardData[]]
  'update:columnWidths': [widths: number[]]
  'resize-start': []
  'resize-end': [widths: number[]]
}>()

const layoutRef = ref<HTMLElement | null>(null)

// Initialize columns from cards
const columns = ref<Column[]>([])

// Flag to prevent recursive updates
let isUpdatingFromProps = false
let isUpdatingFromInternal = false

// Helper to create a hash of cards for comparison
const cardsHash = (cards: CardData[]): string => {
  return cards.map(c => `${c.id}:${c.columnIndex}`).sort().join('|')
}

// Initialize columns structure
const initializeColumns = async () => {
  if (isUpdatingFromInternal) return // Skip if update is from internal drag
  
  isUpdatingFromProps = true
  
  const cols: Column[] = []
  for (let i = 0; i < props.columnsCount; i++) {
    cols.push({ cards: [] })
  }
  
  // Distribute cards to columns
  props.cards.forEach(card => {
    const colIndex = Math.min(card.columnIndex, cols.length - 1)
    cols[colIndex].cards.push(card)
  })
  
  columns.value = cols
  
  await nextTick()
  isUpdatingFromProps = false
}

// Watch for changes in cards and columnsCount from props
watch(() => [props.cards, props.columnsCount], async () => {
  if (!isUpdatingFromInternal) {
    await initializeColumns()
    // Update previous hash after initialization
    const updatedCards: CardData[] = []
    columns.value.forEach((col, colIdx) => {
      col.cards.forEach(card => {
        updatedCards.push({
          ...card,
          columnIndex: colIdx
        })
      })
    })
    previousCardsHash = cardsHash(updatedCards)
  }
}, { immediate: true, deep: false })

// Store previous cards hash to detect actual changes
let previousCardsHash = ''

// Watch for internal column changes and emit updates (only when not updating from props)
watch(() => columns.value, async () => {
  // Skip if update is coming from props change
  if (isUpdatingFromProps) return
  
  const updatedCards: CardData[] = []
  columns.value.forEach((col, colIdx) => {
    col.cards.forEach(card => {
      updatedCards.push({
        ...card,
        columnIndex: colIdx
      })
    })
  })
  
  // Check if cards actually changed
  const newHash = cardsHash(updatedCards)
  if (newHash === previousCardsHash) return
  
  previousCardsHash = newHash
  isUpdatingFromInternal = true
  
  emit('update:cards', updatedCards)
  
  await nextTick()
  isUpdatingFromInternal = false
}, { deep: true })

// Track if we're currently resizing
const isResizing = ref(false)

// Cache container width to avoid repeated DOM reads
let cachedContainerWidth = 0

// Handle column resize
const handleColumnResize = (columnIndex: number, delta: number) => {
  if (columnsCount.value <= 1) return
  
  // Get container width - refresh it each time to handle window resize
  if (!layoutRef.value) return
  
  const containerWidth = layoutRef.value.offsetWidth
  if (containerWidth === 0) return // Avoid division by zero
  
  // Convert pixel delta to percentage delta
  const percentageDelta = (delta / containerWidth) * 100
  
  const newWidths = [...props.columnWidths]
  const nextIndex = columnIndex + 1
  
  if (nextIndex < columnsCount.value) {
    const currentWidth = newWidths[columnIndex]
    const nextWidth = newWidths[nextIndex]
    const minWidthPercent = (200 / containerWidth) * 100
    
    // Calculate new widths by applying the delta
    let newCurrentWidth = currentWidth + percentageDelta
    let newNextWidth = nextWidth - percentageDelta
    
    // Enforce minimum width constraints
    if (newCurrentWidth < minWidthPercent) {
      // Current column hit minimum - adjust delta
      const actualDelta = minWidthPercent - currentWidth
      newCurrentWidth = minWidthPercent
      newNextWidth = nextWidth - actualDelta
    } else if (newNextWidth < minWidthPercent) {
      // Next column hit minimum - adjust delta
      const actualDelta = nextWidth - minWidthPercent
      newCurrentWidth = currentWidth + actualDelta
      newNextWidth = minWidthPercent
    }
    
    // Ensure we don't exceed 100% total
    const totalWidth = newCurrentWidth + newNextWidth
    if (totalWidth > 100) {
      const overflow = totalWidth - 100
      newCurrentWidth -= overflow / 2
      newNextWidth -= overflow / 2
    }
    
    newWidths[columnIndex] = newCurrentWidth
    newWidths[nextIndex] = newNextWidth
    
    // Mark as resizing on first resize
    if (!isResizing.value) {
      isResizing.value = true
      emit('resize-start')
    }
    
    emit('update:columnWidths', newWidths)
  }
}

// Reset cached width when container size might have changed
watch(() => props.columnsCount, () => {
  cachedContainerWidth = 0
})

// Listen for resize end
const handleResizeEnd = () => {
  if (isResizing.value) {
    isResizing.value = false
    cachedContainerWidth = 0 // Reset cache
    emit('resize-end', props.columnWidths)
  }
}

// Listen to document mouseup to detect resize end
onMounted(() => {
  document.addEventListener('mouseup', handleResizeEnd)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleResizeEnd)
})

// Helper to get card index in column
const getCardIndex = (column: Column, cardId: string): number => {
  return column.cards.findIndex(c => c.id === cardId)
}

// Handle drag end
const handleDragEnd = () => {
  // Cards are already updated through v-model binding
}

// Handle card response event
const handleCardResponse = (response: any) => {
  if (props.onResponse) {
    props.onResponse(response)
  }
}

// Get component for card type
const getCardComponent = (type: CardData['type']) => {
  const components = {
    parameters: ParametersCard,
    requestBody: RequestBodyCard,
    responses: ResponsesCard,
    authorization: AuthorizationCard,
    serverUrl: ServerUrlCard,
    tryItOut: TryItOutCard,
    response: ResponseCard,
  }
  return components[type]
}

// Get props for card component
const getCardProps = (type: CardData['type']) => {
  const baseProps = {
    operation: props.operation,
    spec: props.spec,
    sourceUrl: props.sourceUrl,
  }
  
  switch (type) {
    case 'parameters':
    case 'requestBody':
    case 'responses':
      return baseProps
    case 'authorization':
      return {
        ...baseProps,
        authorizationCredentials: props.authorizationCredentials,
      }
    case 'serverUrl':
      return baseProps
    case 'tryItOut':
      return {
        ...baseProps,
        method: props.method,
        path: props.path,
        pathItem: props.pathItem,
        serverUrl: props.serverUrl,
        authorizationCredentials: props.authorizationCredentials,
        initialParameters: props.initialParameters,
        initialRequestBody: props.initialRequestBody,
      }
    case 'response':
      return {
        response: props.response,
      }
    default:
      return baseProps
  }
}

const columnsCount = computed(() => props.columnsCount)
</script>

<style scoped>
.drag-handle {
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 0.9;
}
</style>

