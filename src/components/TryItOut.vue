<template>
  <Card class="p-6 space-y-4">
    <div class="flex items-center gap-2">
      <Play class="w-5 h-5 text-primary" />
      <h3 class="text-lg font-semibold text-foreground">Try It Out</h3>
    </div>

      <!-- Server Selection -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-sm font-medium">Server URL</label>
          <Button
            variant="ghost"
            size="sm"
            @click="isServerUrlLocked = !isServerUrlLocked"
            class="h-7 px-2"
          >
            <Lock v-if="isServerUrlLocked" class="w-4 h-4" />
            <Unlock v-else class="w-4 h-4" />
          </Button>
        </div>
        <div v-if="availableServers.length > 0" class="space-y-2">
          <div class="space-y-2 border border-border rounded-md p-3 bg-muted/30">
            <div
              v-for="(server, idx) in availableServers"
              :key="idx"
              class="flex items-center gap-2"
            >
              <input
                type="radio"
                :id="`server-${idx}`"
                :value="server.url"
                :checked="selectedServer === server.url"
                @change="handleServerSelect(server.url)"
                class="h-4 w-4 text-primary focus:ring-primary"
              />
              <label
                :for="`server-${idx}`"
                class="flex-1 text-sm cursor-pointer"
              >
                <div class="font-medium text-foreground">{{ server.url }}</div>
                <div v-if="server.label.includes('(')" class="text-xs text-muted-foreground">
                  {{ server.label.match(/\(([^)]+)\)/)?.[1] || '' }}
                </div>
              </label>
            </div>
            <div class="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="radio"
                id="server-custom"
                value="custom"
                :checked="selectedServer === 'custom'"
                @change="handleServerSelect('custom')"
                class="h-4 w-4 text-primary focus:ring-primary"
              />
              <label
                for="server-custom"
                class="flex-1 text-sm cursor-pointer font-medium text-foreground"
              >
                Custom URL...
              </label>
            </div>
          </div>
        </div>
        <Input
          v-if="!isServerUrlLocked || selectedServer === 'custom' || availableServers.length === 0"
          :model-value="getCurrentServerUrl()"
          @update:model-value="handleServerUrlUpdate"
          :disabled="isServerUrlLocked && selectedServer !== 'custom' && availableServers.length > 0"
          placeholder="https://api.example.com"
        />
      </div>

    <!-- Parameters -->
    <div v-if="hasParameters" class="space-y-3">
      <h4 class="text-sm font-semibold">Parameters</h4>
      <div
        v-for="(param, idx) in parameters"
        :key="idx"
        class="space-y-1"
      >
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium">
            {{ resolver.resolve(param).name }}
          </label>
          <Badge variant="outline" class="text-xs">
            {{ resolver.resolve(param).in }}
          </Badge>
          <Badge v-if="resolver.resolve(param).required" variant="destructive" class="text-xs">
            required
          </Badge>
        </div>
        <p v-if="resolver.resolve(param).description" class="text-xs text-muted-foreground">
          {{ resolver.resolve(param).description }}
        </p>
        <Input
          :model-value="paramValues[resolver.resolve(param).name] || ''"
          @update:model-value="(val: string) => updateParamValue(resolver.resolve(param).name, val)"
          :placeholder="`Enter ${resolver.resolve(param).name}`"
        />
      </div>
    </div>

      <!-- Request Body -->
      <div v-if="hasRequestBody" class="space-y-2">
        <h4 class="text-sm font-semibold">Request Body</h4>
        <Textarea
          :model-value="requestBody"
          @update:model-value="requestBody = $event"
          placeholder="Enter JSON request body"
          class="font-mono text-xs min-h-[150px]"
        />
      </div>

    <!-- Execute Button -->
    <Button
      @click="handleExecute"
      :disabled="isExecuting"
      class="w-full"
    >
      <Play class="w-4 h-4 mr-2" />
      {{ isExecuting ? 'Executing...' : 'Execute' }}
    </Button>

    <!-- Response -->
    <div v-if="response" class="space-y-3 pt-4 border-t">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold">Response</h4>
        <Button
          variant="ghost"
          size="sm"
          @click="handleCopy(JSON.stringify(response, null, 2))"
        >
          <Check v-if="copied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </Button>
      </div>

      <Card v-if="response.error" class="p-4 bg-destructive/10 border-destructive">
        <p class="text-sm font-semibold text-destructive">Error</p>
        <p class="text-xs text-muted-foreground mt-1">
          {{ response.message }}
        </p>
      </Card>

      <template v-else>
        <div class="flex gap-2 flex-wrap">
          <Badge
            :variant="response.status >= 200 && response.status < 300 ? 'default' : 'destructive'"
          >
            {{ response.status }} {{ response.statusText }}
          </Badge>
          <Badge variant="outline">{{ response.duration }}ms</Badge>
        </div>

        <Tabs :model-value="responseTab" @update:model-value="responseTab = $event" class="w-full">
          <TabsList class="w-full">
            <TabsTrigger value="body" class="flex-1">Body</TabsTrigger>
            <TabsTrigger value="headers" class="flex-1">Headers</TabsTrigger>
          </TabsList>

          <TabsContent value="body">
            <ScrollArea class="h-[300px] w-full">
              <pre class="bg-code-bg border border-code-border rounded-lg p-3 text-xs overflow-x-auto">
                {{ typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2) }}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="headers">
            <ScrollArea class="h-[300px] w-full">
              <div class="space-y-2">
                <div
                  v-for="[key, value] in Object.entries(response.headers)"
                  :key="key"
                  class="border border-border rounded p-2"
                >
                  <code class="text-xs font-semibold">{{ key }}</code>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ value as string }}
                  </p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </template>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Play, Copy, Check, Lock, Unlock } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import Textarea from './ui/Textarea.vue'
import Badge from './ui/Badge.vue'
import ScrollArea from './ui/ScrollArea.vue'
import Tabs from './ui/Tabs.vue'
import TabsList from './ui/TabsList.vue'
import TabsTrigger from './ui/TabsTrigger.vue'
import TabsContent from './ui/TabsContent.vue'
import { useToast } from '@/composables/useToast'
import type { Operation, OpenAPISpec } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'

interface Props {
  method: string
  path: string
  operation: Operation
  spec: OpenAPISpec
  sourceUrl?: string
}

const props = defineProps<Props>()

const { toast } = useToast()
const resolver = new RefResolver(props.spec)
const isExecuting = ref(false)
const response = ref<any>(null)
const copied = ref(false)
const responseTab = ref('body')
const paramValues = ref<Record<string, string>>({})
const requestBody = ref('{}')
const customServerUrl = ref('')
const isServerUrlLocked = ref(true)

// Extract base URL from sourceUrl if it's a URL
const extractBaseUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.host}`
  } catch {
    return null
  }
}

// Build list of available servers
const availableServers = computed(() => {
  const servers: Array<{ url: string; label: string }> = []
  
  // Add operation-specific servers
  if (props.operation.servers && props.operation.servers.length > 0) {
    props.operation.servers.forEach((server, idx) => {
      servers.push({
        url: server.url,
        label: server.description 
          ? `${server.url} (${server.description})` 
          : server.url
      })
    })
  }
  
  // Add spec-level servers
  if (props.spec.servers && props.spec.servers.length > 0) {
    props.spec.servers.forEach((server, idx) => {
      // Avoid duplicates
      if (!servers.some(s => s.url === server.url)) {
        servers.push({
          url: server.url,
          label: server.description 
            ? `${server.url} (${server.description})` 
            : server.url
        })
      }
    })
  }
  
  // Add sourceUrl base URL if available
  if (props.sourceUrl) {
    const baseUrl = extractBaseUrl(props.sourceUrl)
    if (baseUrl && !servers.some(s => s.url === baseUrl)) {
      servers.push({
        url: baseUrl,
        label: `${baseUrl} (from spec URL)`
      })
    }
  }
  
  return servers
})

// Initialize selected server
const getInitialServer = (): string => {
  if (props.operation.servers && props.operation.servers.length > 0) {
    return props.operation.servers[0].url
  }
  if (props.spec.servers && props.spec.servers.length > 0) {
    return props.spec.servers[0].url
  }
  if (props.sourceUrl) {
    const baseUrl = extractBaseUrl(props.sourceUrl)
    if (baseUrl) {
      return baseUrl
    }
  }
  return ''
}

const selectedServer = ref(getInitialServer())

// Handle server selection from dropdown
const handleServerSelect = (value: string) => {
  selectedServer.value = value
  if (value === 'custom') {
    customServerUrl.value = ''
  }
}

// Handle server URL input update
const handleServerUrlUpdate = (value: string) => {
  if (selectedServer.value === 'custom') {
    customServerUrl.value = value
  } else if (!isServerUrlLocked.value) {
    // When unlocked, allow editing any URL
    // Check if the entered URL matches any available server
    const matchingServer = availableServers.value.find(s => s.url === value)
    if (matchingServer) {
      // If it matches a server, select that server
      selectedServer.value = matchingServer.url
    } else if (value.trim() !== '') {
      // If it doesn't match and is not empty, select custom
      selectedServer.value = 'custom'
      customServerUrl.value = value
    } else {
      // Empty value - keep current selection
      selectedServer.value = value
    }
  } else {
    // When locked, check if value matches any server
    const matchingServer = availableServers.value.find(s => s.url === value)
    if (matchingServer) {
      selectedServer.value = matchingServer.url
    } else if (value.trim() !== '') {
      // If it doesn't match, switch to custom
      selectedServer.value = 'custom'
      customServerUrl.value = value
    }
  }
}

// Get current server URL for display
const getCurrentServerUrl = (): string => {
  if (selectedServer.value === 'custom') {
    return customServerUrl.value
  }
  return selectedServer.value
}

const parameters = computed(() => props.operation.parameters || [])
const hasParameters = computed(() => parameters.value.length > 0)
const hasRequestBody = computed(() => props.operation.requestBody !== undefined)

const updateParamValue = (name: string, value: string) => {
  paramValues.value = { ...paramValues.value, [name]: value }
}

const handleExecute = async () => {
  isExecuting.value = true
  response.value = null

  try {
    const serverUrl = selectedServer.value === 'custom' ? customServerUrl.value : selectedServer.value
    if (!serverUrl) {
      toast({
        title: 'Server URL required',
        description: 'Please select or enter a server URL',
        variant: 'destructive',
      })
      isExecuting.value = false
      return
    }
    
    let url = serverUrl + props.path
    const queryParams: string[] = []

    parameters.value.forEach((param) => {
      const resolvedParam = resolver.resolve(param)
      const value = paramValues.value[resolvedParam.name]
      
      if (value) {
        if (resolvedParam.in === 'path') {
          url = url.replace(`{${resolvedParam.name}}`, encodeURIComponent(value))
        } else if (resolvedParam.in === 'query') {
          queryParams.push(`${encodeURIComponent(resolvedParam.name)}=${encodeURIComponent(value)}`)
        }
      }
    })

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    parameters.value.forEach((param) => {
      const resolvedParam = resolver.resolve(param)
      const value = paramValues.value[resolvedParam.name]
      if (value && resolvedParam.in === 'header') {
        headers[resolvedParam.name] = value
      }
    })

    const options: RequestInit = {
      method: props.method.toUpperCase(),
      headers,
    }

    if (props.method.toLowerCase() !== 'get' && props.method.toLowerCase() !== 'head') {
      try {
        const bodyObj = JSON.parse(requestBody.value)
        options.body = JSON.stringify(bodyObj)
      } catch (e) {
        toast({
          title: 'Invalid JSON',
          description: 'Request body must be valid JSON',
          variant: 'destructive',
        })
        isExecuting.value = false
        return
      }
    }

    const startTime = Date.now()
    const res = await fetch(url, options)
    const duration = Date.now() - startTime

    const contentType = res.headers.get('content-type')
    let responseData
    
    if (contentType?.includes('application/json')) {
      responseData = await res.json()
    } else {
      responseData = await res.text()
    }

    const responseHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      data: responseData,
      duration,
      url,
    }

    toast({
      title: `Response: ${res.status}`,
      description: `Request completed in ${duration}ms`,
    })
  } catch (error: any) {
    const serverUrl = selectedServer.value === 'custom' ? customServerUrl.value : selectedServer.value
    response.value = {
      error: true,
      message: error.message,
      url: (serverUrl || '') + props.path,
    }
    
    toast({
      title: 'Request Failed',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    isExecuting.value = false
  }
}

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
  toast({
    title: 'Copied!',
    description: 'Response copied to clipboard',
  })
}
</script>

