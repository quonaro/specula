<template>
  <div :class="cn('w-full', className)">
    <div v-for="(item, index) in items" :key="getItemKey(item, index)" :class="cn('border-b', itemClass)">
      <button
        :class="cn(
          'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left',
          isOpen(item, index) ? '[&>svg]:rotate-180' : '',
          triggerClass
        )"
        @click="toggle(item, index)"
      >
        <slot name="trigger" :item="item" :index="index">
          {{ item.label || item.value || `Item ${index + 1}` }}
        </slot>
        <ChevronDown class="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
      <div
        v-show="isOpen(item, index)"
        :class="cn(
          'overflow-hidden text-sm transition-all',
          contentClass
        )"
      >
        <div :class="cn('pb-4 pt-0', contentInnerClass)">
          <slot name="content" :item="item" :index="index">
            {{ item.content }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface AccordionItem {
  label?: string
  value?: string
  content?: string
  [key: string]: any
}

interface Props {
  items?: AccordionItem[]
  type?: 'single' | 'multiple'
  className?: string
  itemClass?: string
  triggerClass?: string
  contentClass?: string
  contentInnerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  type: 'single',
  className: '',
  itemClass: '',
  triggerClass: '',
  contentClass: '',
  contentInnerClass: '',
})

const openItems = ref<Set<string>>(new Set())

const getItemKey = (item: AccordionItem, index: number) => {
  return item.value || item.label || `item-${index}`
}

const isOpen = (item: AccordionItem, index: number) => {
  const key = getItemKey(item, index)
  return openItems.value.has(key)
}

const toggle = (item: AccordionItem, index: number) => {
  const key = getItemKey(item, index)
  if (props.type === 'single') {
    openItems.value.clear()
    if (!isOpen(item, index)) {
      openItems.value.add(key)
    }
  } else {
    if (isOpen(item, index)) {
      openItems.value.delete(key)
    } else {
      openItems.value.add(key)
    }
  }
}
</script>

