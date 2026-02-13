<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between flex-shrink-0 p-8 pb-4">
      <OperationHeader :method="method" :path="path" :operation="operation" :spec="spec" />
      <Button variant="ghost" size="sm" @click="showSettingsDialog = true">
        <Settings class="w-4 h-4" />
      </Button>
    </div>

    <!-- Horizontal separator line -->
          <Separator />

    <!-- Column Layout -->
    <ColumnLayout
      :columns-count="columnsCount"
      :column-widths="columnWidths"
      :cards="cards"
      :operation="operation"
      :spec="spec"
      :path="path"
      :method="method"
      :path-item="pathItem"
      :source-url="sourceUrl"
      :server-url="currentServerUrl"
      :authorization-credentials="getAuthorizationCredentials"
      :initial-parameters="initialState?.parameters"
      :initial-request-body="initialState?.requestBody"
      :response="response"
      @update:cards="handleCardsUpdate"
      @update:column-widths="handleColumnWidthsUpdate"
      @resize-start="handleResizeStart"
      @resize-end="handleResizeEnd"
      @response="handleResponse"
    />

    <!-- Settings Dialog -->
    <ColumnSettingsDialog
      v-model="showSettingsDialog"
      :columns-count="columnsCount"
      :column-widths="columnWidths"
      :cards="cards"
      :available-card-types="getAvailableCardTypes"
      @update:columns-count="handleColumnsCountUpdate"
      @update:cards="handleCardsUpdate"
      @reset="resetLayout"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, provide } from 'vue'
import { Settings } from 'lucide-vue-next'
import type { Operation, OpenAPISpec, PathItem } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import { getOperationSecurity } from '@/utils/openapi-parser'
import { useAuthorizationStore } from '@/stores/authorization'
import { useSettingsStore } from '@/stores/settings'
import Button from './ui/Button.vue'
import Separator from './ui/Separator.vue'
import OperationHeader from './operation/OperationHeader.vue'
import ColumnLayout, { type CardData } from './operation/ColumnLayout.vue'
import ColumnSettingsDialog from './operation/ColumnSettingsDialog.vue'
import type { RequestHistoryItem } from '@/stores/requestHistory'

interface Props {
  method: string
  path: string
  operation: Operation
  spec: OpenAPISpec
  sourceUrl?: string
  initialState?: RequestHistoryItem
}

const props = defineProps<Props>()

const resolver = new RefResolver(props.spec)

// Get pathItem for security check
const pathItem = computed(() => {
  return props.spec.paths[props.path] as PathItem | undefined
})

// Get effective security requirements for this operation
const operationSecurity = computed(() => {
  return getOperationSecurity(props.operation, pathItem.value, props.spec)
})

// Authorization management
const authorizationStore = useAuthorizationStore()
const settingsStore = useSettingsStore()
const localAuthorizationCredentials = ref<Record<string, string>>({})

// Initialize local credentials from global store
const initializeLocalCredentials = () => {
  const globalCredentials = authorizationStore.getCredentials(props.spec, props.sourceUrl)
  localAuthorizationCredentials.value = { ...globalCredentials }
}

// Get all authorization credentials (local, fallback to global)
const getAuthorizationCredentials = computed(() => {
  return localAuthorizationCredentials.value
})

// Watch for spec changes and reinitialize
watch(() => [props.spec, props.sourceUrl], () => {
  initializeLocalCredentials()
}, { immediate: true })

// Server URL management
const customServerUrl = ref('')
const selectedServer = ref('')

// Initialize selected server
const initializeServer = () => {
  // Check persisted preference first
  if (settingsStore.preferredServerType === 'custom' && settingsStore.customServerUrl) {
    selectedServer.value = 'custom'
    customServerUrl.value = settingsStore.customServerUrl
    return
  }
  
  if (settingsStore.preferredServerType === 'current-host') {
    selectedServer.value = 'current-host'
    return
  }
  
  // If preference is 'spec' or not set, fall back to default priority:
  // Priority: operation servers > spec servers > sourceUrl > current-host
  if (props.operation.servers && props.operation.servers.length > 0) {
    selectedServer.value = props.operation.servers[0].url
    return
  }
  if (props.spec.servers && props.spec.servers.length > 0) {
    selectedServer.value = props.spec.servers[0].url
    return
  }
  if (props.sourceUrl) {
    try {
      const urlObj = new URL(props.sourceUrl)
      selectedServer.value = `${urlObj.protocol}//${urlObj.host}`
      return
    } catch {
      // Invalid URL
    }
  }
  
  // If no other option, and we are not forcing a preference, default to current-host
  selectedServer.value = 'current-host'
}

// Get current host URL
const getCurrentHostUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  return ''
}

// Watch for initial state to restore server URL
watch(() => props.initialState, (newState) => {
  if (newState?.serverUrl) {
    // Check if it matches any spec server
    const specServers = props.spec.servers || []
    const opServers = props.operation.servers || []
    const allServers = [...opServers, ...specServers]
    
    const matchingServer = allServers.find(s => s.url === newState.serverUrl)
    
    if (matchingServer) {
        selectedServer.value = matchingServer.url
    } else {
        // Must be custom or current host
        if (newState.serverUrl === getCurrentHostUrl()) {
            selectedServer.value = 'current-host'
        } else {
            selectedServer.value = 'custom'
            customServerUrl.value = newState.serverUrl
        }
    }
  }
  
  if (newState?.authorization) {
    localAuthorizationCredentials.value = { ...newState.authorization }
  }
}, { immediate: true })

// Get current server URL for display
const currentServerUrl = computed(() => {
  if (selectedServer.value === 'custom') {
    return customServerUrl.value
  }
  if (selectedServer.value === 'current-host') {
    return getCurrentHostUrl()
  }
  return selectedServer.value || getCurrentHostUrl()
})

// Provide server URL update function
const updateServerUrl = (url: string) => {
  selectedServer.value = url
  
  if (url === 'custom') {
    customServerUrl.value = settingsStore.customServerUrl || ''
    settingsStore.setServerPreference('custom', customServerUrl.value)
  } else if (url === 'current-host') {
    settingsStore.setServerPreference('current-host')
  } else {
    // It's a spec defined server
    settingsStore.setServerPreference('spec')
  }

  if (url === 'custom') {
    // Ensure we don't overwrite if it was already set from store
    if (!customServerUrl.value && settingsStore.customServerUrl) {
       customServerUrl.value = settingsStore.customServerUrl
    }
  } else {
     // If switching away from custom, we might want to keep the custom URL in the store?
     // Yes, setServerPreference('spec') doesn't clear customServerUrl in the store.
  }
}

const updateCustomServerUrl = (url: string) => {
  customServerUrl.value = url
  selectedServer.value = 'custom'
  settingsStore.setServerPreference('custom', url)
}

// Provide authorization update function
const updateAuthorizationCredential = (scheme: string, credential: string) => {
  localAuthorizationCredentials.value = {
    ...localAuthorizationCredentials.value,
    [scheme]: credential,
  }
}

// Provide values for child components
provide('operationView', {
  getServerUrl: () => currentServerUrl.value,
  updateServerUrl,
  updateCustomServerUrl,
  getSelectedServer: () => selectedServer.value,
  getAuthorizationCredentials: () => localAuthorizationCredentials.value,
  updateAuthorizationCredential,
})

// Response management
const response = ref<any>(null)

const handleResponse = (responseData: any) => {
  if (responseData) {
    response.value = {
      status: responseData.status,
      statusText: responseData.statusText,
      headers: responseData.headers || {},
      data: responseData.data,
      duration: responseData.duration,
      url: responseData.url,
      error: responseData.error || false,
      message: responseData.message
    }
  }
}

// Layout state
const STORAGE_KEY = 'operationViewLayout'
const showSettingsDialog = ref(false)

// Get available card types based on operation
const getAvailableCardTypes = computed(() => {
  const types: Array<{ type: CardData['type']; label: string; available: boolean }> = []
  
  types.push({
    type: 'parameters',
    label: 'Parameters',
    available: !!(props.operation.parameters && props.operation.parameters.length > 0)
  })
  
  types.push({
    type: 'requestBody',
    label: 'Request Body',
    available: !!props.operation.requestBody
  })
  
  types.push({
    type: 'responses',
    label: 'Responses',
    available: !!props.operation.responses
  })
  
  types.push({
    type: 'authorization',
    label: 'Authorization',
    available: !!(operationSecurity.value && operationSecurity.value.length > 0)
  })
  
  types.push({
    type: 'serverUrl',
    label: 'Server URL',
    available: true
  })
  
  types.push({
    type: 'tryItOut',
    label: 'Try It Out',
    available: true
  })
  
  types.push({
    type: 'response',
    label: 'Response',
    available: true
  })
  
  return types
})

// Default layout configuration
const getDefaultLayout = (): { columnsCount: number; columnWidths: number[]; cards: CardData[] } => {
  const cards: CardData[] = []
  let cardId = 0
  
  // Left column (documentation)
  if (props.operation.parameters && props.operation.parameters.length > 0) {
    cards.push({ id: `card-${cardId++}`, type: 'parameters', columnIndex: 0 })
  }
  if (props.operation.requestBody) {
    cards.push({ id: `card-${cardId++}`, type: 'requestBody', columnIndex: 0 })
  }
  if (props.operation.responses) {
    cards.push({ id: `card-${cardId++}`, type: 'responses', columnIndex: 0 })
  }
  
  // Right column (Try It Out)
  if (operationSecurity.value && operationSecurity.value.length > 0) {
    cards.push({ id: `card-${cardId++}`, type: 'authorization', columnIndex: 1 })
  }
  cards.push({ id: `card-${cardId++}`, type: 'serverUrl', columnIndex: 1 })
  cards.push({ id: `card-${cardId++}`, type: 'tryItOut', columnIndex: 1 })
  cards.push({ id: `card-${cardId++}`, type: 'response', columnIndex: 1 })
  
  return {
    columnsCount: 2,
    columnWidths: [50, 50],
    cards
  }
}

// Load layout from localStorage or use default
const loadLayout = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Validate structure
      if (parsed.columnsCount >= 1 && parsed.columnsCount <= 4 &&
          Array.isArray(parsed.columnWidths) && parsed.columnWidths.length === parsed.columnsCount &&
          Array.isArray(parsed.cards)) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Failed to load layout from localStorage:', error)
  }
  return getDefaultLayout()
}

// Save layout to localStorage
const saveLayout = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      columnsCount: columnsCount.value,
      columnWidths: columnWidths.value,
      cards: cards.value
    }))
  } catch (error) {
    console.error('Failed to save layout to localStorage:', error)
  }
}

// Initialize layout state
const defaultLayout = loadLayout()
const columnsCount = ref(defaultLayout.columnsCount)
const columnWidths = ref(defaultLayout.columnWidths)
const cards = ref<CardData[]>(defaultLayout.cards)

// Track if we're resizing to avoid saving on every update
const isResizing = ref(false)

// Handle layout updates
const handleCardsUpdate = (newCards: CardData[]) => {
  cards.value = newCards
  // Don't save during resize, only on final state
  if (!isResizing.value) {
    saveLayout()
  }
}

const handleColumnWidthsUpdate = (newWidths: number[]) => {
  columnWidths.value = newWidths
  // Don't save during resize, only on final state
  if (!isResizing.value) {
    saveLayout()
  }
}

const handleResizeStart = () => {
  isResizing.value = true
}

const handleResizeEnd = (widths: number[]) => {
  isResizing.value = false
  columnWidths.value = widths
  // Save only when resize is complete
  saveLayout()
}

const handleColumnsCountUpdate = (count: number) => {
  columnsCount.value = count
  // Adjust widths - automatically equalize
  columnWidths.value = Array(count).fill(100 / count)
  // Adjust card column indices if needed
  cards.value = cards.value.map(card => ({
    ...card,
    columnIndex: Math.min(card.columnIndex, count - 1)
  }))
  saveLayout()
}

const resetLayout = () => {
  const defaultLayout = getDefaultLayout()
  columnsCount.value = defaultLayout.columnsCount
  columnWidths.value = defaultLayout.columnWidths
  cards.value = defaultLayout.cards
  saveLayout()
}

// Initialize on mount
onMounted(() => {
  initializeLocalCredentials()
  initializeServer()
})

// Watch for operation changes and reset layout if needed
watch(() => [props.operation, props.path, props.method], () => {
  // Optionally reset to default when operation changes
  // Or keep current layout - uncomment next line to reset:
  // resetLayout()
}, { immediate: false })
</script>
