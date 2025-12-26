<template>
  <Dialog :model-value="modelValue" @update:model-value="updateModelValue" title="Column Layout Settings">
    <div class="space-y-6">
      <!-- Number of Columns -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Number of Columns</label>
        <div class="flex gap-2">
          <Button
            v-for="num in [1, 2, 3, 4]"
            :key="num"
            :variant="columnsCount === num ? 'default' : 'outline'"
            size="sm"
            @click="updateColumnsCount(num)"
          >
            {{ num }}
          </Button>
        </div>
      </div>

      <!-- Visible Cards -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Visible Cards</label>
        <div class="space-y-2 border border-border rounded-lg p-3 max-h-[400px] overflow-y-auto">
          <div
            v-for="cardType in availableCardTypes"
            :key="cardType.type"
            class="flex items-center gap-2 p-2 rounded transition-colors"
            :class="cardType.available ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'"
          >
            <Checkbox
              :model-value="isCardVisible(cardType.type)"
              :disabled="!cardType.available"
              @update:model-value="(checked) => toggleCardVisibility(cardType.type, checked)"
            >
              <span class="text-sm text-foreground">{{ cardType.label }}</span>
              <span v-if="!cardType.available" class="text-xs text-muted-foreground ml-1">(not available)</span>
            </Checkbox>
          </div>
        </div>
      </div>

      <!-- Reset to Default -->
      <div class="pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          @click="resetToDefault"
          class="w-full"
        >
          Reset to Default Layout
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="updateModelValue(false)">Close</Button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CardData } from './ColumnLayout.vue'
import Dialog from '../ui/Dialog.vue'
import Button from '../ui/Button.vue'
import Checkbox from '../ui/Checkbox.vue'

interface CardTypeInfo {
  type: CardData['type']
  label: string
  available: boolean
}

interface Props {
  modelValue: boolean
  columnsCount: number
  columnWidths: number[]
  cards: CardData[]
  availableCardTypes: CardTypeInfo[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:columnsCount': [count: number]
  'update:cards': [cards: CardData[]]
  'reset': []
}>()

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value)
}

const updateColumnsCount = (count: number) => {
  emit('update:columnsCount', count)
  // Auto-adjust card column indices when changing column count
  const updatedCards = props.cards.map(card => ({
    ...card,
    columnIndex: Math.min(card.columnIndex, count - 1)
  }))
  emit('update:cards', updatedCards)
}

const isCardVisible = (cardType: CardData['type']): boolean => {
  return props.cards.some(card => card.type === cardType)
}

const toggleCardVisibility = (cardType: CardData['type'], visible: boolean) => {
  // Check if card type is available
  const cardInfo = props.availableCardTypes.find(ct => ct.type === cardType)
  if (!cardInfo || !cardInfo.available) return
  
  if (visible) {
    // Add card if it doesn't exist
    if (!isCardVisible(cardType)) {
      const newCards = [...props.cards]
      // Find max id to generate new one
      const maxId = newCards.reduce((max, card) => {
        const num = parseInt(card.id.replace('card-', '') || '0')
        return Math.max(max, num)
      }, -1)
      
      // Determine default column index based on card type
      let defaultColumn = 0
      if (cardType === 'authorization' || cardType === 'serverUrl' || cardType === 'tryItOut' || cardType === 'response') {
        defaultColumn = Math.min(1, props.columnsCount - 1)
      }
      
      newCards.push({
        id: `card-${maxId + 1}`,
        type: cardType,
        columnIndex: defaultColumn
      })
      emit('update:cards', newCards)
    }
  } else {
    // Remove card if it exists
    const newCards = props.cards.filter(card => card.type !== cardType)
    emit('update:cards', newCards)
  }
}

const resetToDefault = () => {
  emit('reset')
}
</script>

