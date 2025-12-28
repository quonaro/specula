<template>
  <Card class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <FileText class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold text-foreground">Response</h3>
        <Badge v-if="response?.status" variant="none" :class="`${getStatusColorClass(response.status)} text-white font-bold text-sm`">
          {{ response.status }}
        </Badge>
      </div>
      <Button v-if="response" variant="ghost" size="sm" @click="handleCopy(getResponseText)">
        <Check v-if="copied" class="w-4 h-4" />
        <Copy v-else class="w-4 h-4" />
      </Button>
    </div>

    <Textarea :model-value="getResponseText" readonly
      class="h-[400px] w-full bg-code-bg border border-code-border text-xs font-mono resize-none" />
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Copy, Check, FileText } from 'lucide-vue-next'
import { getStatusColorClass } from '@/utils/operation-cache'
import { useToast } from '@/composables/useToast'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import Textarea from '../ui/Textarea.vue'

interface Props {
  response?: any
}

const props = defineProps<Props>()

const { toast } = useToast()
const copied = ref(false)

// Watch for response changes and reset copied state
watch(() => props.response, () => {
  copied.value = false
})

// Get response text for display
const getResponseText = computed((): string => {
  if (!props.response) {
    return 'No response yet. Execute a request to see the response here.'
  }

  try {
    // If there's an error, show error information
    if (props.response.error) {
      const errorInfo = {
        error: true,
        message: props.response.message || 'Unknown error',
        status: props.response.status,
        statusText: props.response.statusText
      }
      return JSON.stringify(errorInfo, null, 2)
    }

    // If response has data, format it as JSON
    if (props.response.data !== undefined && props.response.data !== null) {
      // If data is already a string, try to parse it as JSON, otherwise return as is
      if (typeof props.response.data === 'string') {
        try {
          // Try to parse and re-stringify to format it nicely
          const parsed = JSON.parse(props.response.data)
          return JSON.stringify(parsed, null, 2)
        } catch {
          // If it's not valid JSON, return as is
          return props.response.data
        }
      } else {
        // If data is an object, stringify it
        return JSON.stringify(props.response.data, null, 2)
      }
    } else {
      // If no data, return empty response message
      return '(empty response)'
    }
  } catch (error) {
    // Fallback: return stringified response object
    return JSON.stringify(props.response, null, 2)
  }
})

// Copy text to clipboard with fallback
const copyToClipboard = async (text: string): Promise<boolean> => {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error)
      // Fall through to fallback method
    }
  }

  // Fallback method for older browsers or when Clipboard API fails
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    if (!successful) {
      throw new Error('execCommand copy failed')
    }
    return true
  } catch (error) {
    console.error('Fallback copy method failed:', error)
    return false
  }
}

// Handle copy
const handleCopy = async (text: string) => {
  const success = await copyToClipboard(text)

  if (success) {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
    toast({
      title: 'Copied!',
      description: 'Response copied to clipboard',
    })
  } else {
    toast({
      title: 'Copy Failed',
      description: 'Failed to copy response to clipboard. Please try selecting and copying manually.',
      variant: 'destructive',
    })
  }
}
</script>


