<template>
  <div class="h-full flex flex-col">
    <!-- Header (Common for both columns) -->
    <div class="p-8 pb-4 space-y-3 flex-shrink-0">
        <div class="flex items-center gap-3">
          <Badge :class="`${getMethodColorClass(method)} text-white font-bold px-3 py-1`">
            {{ method }}
          </Badge>
          <code
            class="text-lg font-mono text-foreground"
            :title="path"
          >{{ path }}</code>
          <div
            class="w-3 h-3 rounded-full shrink-0"
            :class="isPrivate ? 'bg-red-500' : 'bg-green-500'"
          ></div>
        </div>
        <h2 v-if="operation.summary" class="text-2xl font-bold text-foreground">
          {{ operation.summary }}
        </h2>
        <p v-if="operation.description" class="text-muted-foreground">
          {{ operation.description }}
        </p>
        <div class="flex gap-2 flex-wrap">
          <Badge v-if="operation.deprecated" variant="destructive">Deprecated</Badge>
          <Badge v-if="operation.operationId" variant="outline">ID: {{ operation.operationId }}</Badge>
        </div>
        <a
          v-if="operation.externalDocs"
          :href="operation.externalDocs.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          📖 {{ operation.externalDocs.description || 'External Documentation' }}
        </a>
    </div>

    <!-- Columns with separate scroll -->
    <div class="flex-1 grid grid-cols-2 gap-6 px-8 pb-8 min-h-0">
      <!-- Main Content (Left Column) -->
      <ScrollArea class="h-full [&>div::-webkit-scrollbar]:hidden [&>div]:[scrollbar-width:none]">
        <div class="space-y-6 pr-4">
          <!-- Operation-specific Servers -->
          <template v-if="operation.servers && operation.servers.length > 0">
            <Separator />
            <ServersView :servers="operation.servers" title="Operation Servers" />
          </template>

          <!-- Parameters -->
          <template v-if="operation.parameters && operation.parameters.length > 0">
            <Separator />
            <Card class="p-6 space-y-4">
              <h3 class="text-lg font-semibold text-foreground">Parameters</h3>
              <div class="space-y-3">
                <div
                  v-for="(param, idx) in operation.parameters"
                  :key="idx"
                  class="border border-border rounded-lg p-4 space-y-2"
                >
                  <div class="flex items-center gap-2 flex-wrap">
                    <code class="text-sm font-semibold text-foreground">
                      {{ resolver.resolve(param).name }}
                    </code>
                    <Badge variant="outline" class="text-xs">
                      {{ resolver.resolve(param).in }}
                    </Badge>
                    <Badge v-if="resolver.resolve(param).required" variant="destructive" class="text-xs">
                      required
                    </Badge>
                    <Badge v-if="resolver.resolve(param).deprecated" variant="destructive" class="text-xs">
                      deprecated
                    </Badge>
                  </div>
                  <p v-if="resolver.resolve(param).description" class="text-sm text-muted-foreground">
                    {{ resolver.resolve(param).description }}
                  </p>
                  <div v-if="resolver.resolve(param).schema" class="mt-2">
                    <SchemaView :schema="resolver.resolve(param).schema!" :resolver="resolver" />
                  </div>
                  <div
                    v-if="resolver.resolve(param).examples && Object.keys(resolver.resolve(param).examples || {}).length > 0"
                    class="mt-2"
                  >
                    <span class="text-xs font-medium">Examples:</span>
                    <div
                      v-for="[exName, ex] in Object.entries(resolver.resolve(param).examples || {})"
                      :key="exName"
                      class="mt-1"
                    >
                      <Badge variant="secondary" class="text-xs mb-1">{{ exName }}</Badge>
                      <p v-if="resolver.resolve(ex).description" class="text-xs text-muted-foreground">
                        {{ resolver.resolve(ex).description }}
                      </p>
                      <pre
                        v-if="resolver.resolve(ex).value !== undefined"
                        class="text-xs bg-code-bg px-2 py-1 rounded mt-1"
                      >
                        {{ JSON.stringify(resolver.resolve(ex).value, null, 2) }}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </template>

          <!-- Request Body -->
          <template v-if="operation.requestBody">
            <Separator />
            <Card class="p-6 space-y-4">
              <h3 class="text-lg font-semibold text-foreground">Request Body</h3>
              <template v-if="resolvedBody">
                <p v-if="resolvedBody.description" class="text-sm text-muted-foreground">
                  {{ resolvedBody.description }}
                </p>
                <Badge v-if="resolvedBody.required" variant="destructive" class="text-xs">
                  required
                </Badge>
                <div
                  v-for="[contentType, mediaType] in Object.entries(resolvedBody.content || {})"
                  :key="contentType"
                  class="space-y-3"
                >
                  <div class="text-sm font-medium text-foreground">
                    Content-Type: <code>{{ contentType }}</code>
                  </div>
                  <SchemaView
                    v-if="mediaType?.schema"
                    :schema="mediaType.schema"
                    title="Schema"
                    :resolver="resolver"
                  />
                  <div
                    v-if="mediaType?.examples && Object.keys(mediaType.examples).length > 0"
                    class="space-y-2"
                  >
                    <h4 class="text-sm font-semibold">Examples:</h4>
                    <div
                      v-for="[exName, ex] in Object.entries(mediaType.examples)"
                      :key="exName"
                    >
                      <Badge variant="secondary" class="mb-1">{{ exName }}</Badge>
                      <p v-if="resolver.resolve(ex).description" class="text-sm text-muted-foreground">
                        {{ resolver.resolve(ex).description }}
                      </p>
                      <pre
                        v-if="resolver.resolve(ex).value !== undefined"
                        class="bg-code-bg border border-code-border rounded-lg p-3 overflow-x-auto text-xs"
                      >
                        {{ JSON.stringify(resolver.resolve(ex).value, null, 2) }}
                      </pre>
                    </div>
                  </div>
                  <div
                    v-if="mediaType?.encoding && Object.keys(mediaType.encoding).length > 0"
                    class="space-y-2"
                  >
                    <h4 class="text-sm font-semibold">Encoding:</h4>
                    <div
                      v-for="[fieldName, encoding] in Object.entries(mediaType.encoding)"
                      :key="fieldName"
                      class="border border-border rounded p-2"
                    >
                      <code class="text-xs font-semibold">{{ fieldName }}</code>
                      <div v-if="encoding.contentType" class="text-xs text-muted-foreground">
                        Content-Type: {{ encoding.contentType }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </Card>
          </template>

          <!-- Responses -->
          <template v-if="operation.responses">
            <Separator />
            <Card class="p-6 space-y-4">
              <h3 class="text-lg font-semibold text-foreground">Responses</h3>
              <div class="space-y-4">
                <div
                  v-for="[code, response] in Object.entries(operation.responses)"
                  :key="code"
                  class="border border-border rounded-lg p-4 space-y-3"
                >
                  <div class="flex items-center gap-2">
                    <Badge :variant="code.startsWith('2') ? 'default' : 'destructive'">
                      {{ code }}
                    </Badge>
                    <span class="text-sm text-foreground">
                      {{ resolver.resolve(response).description }}
                    </span>
                  </div>
                  
                  <div
                    v-if="resolver.resolve(response).headers && Object.keys(resolver.resolve(response).headers || {}).length > 0"
                    class="space-y-2"
                  >
                    <h4 class="text-sm font-semibold">Headers:</h4>
                    <div
                      v-for="[headerName, header] in Object.entries(resolver.resolve(response).headers || {})"
                      :key="headerName"
                      class="text-sm"
                    >
                      <code class="font-semibold">{{ headerName }}</code>
                      <span v-if="resolver.resolve(header).description" class="text-muted-foreground ml-2">
                        - {{ resolver.resolve(header).description }}
                      </span>
                    </div>
                  </div>

                  <div
                    v-if="resolver.resolve(response).content"
                    v-for="[contentType, mediaType] in Object.entries(resolver.resolve(response).content || {})"
                    :key="contentType"
                    class="space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium text-foreground">
                        Content-Type: <code>{{ contentType }}</code>
                      </div>
                      <div v-if="mediaType?.schema" class="flex items-center gap-2">
                        <span class="text-xs text-muted-foreground">Format:</span>
                        <div class="inline-flex gap-0.5 bg-muted rounded-md p-0.5 border border-border">
                          <button
                            :class="[
                              'px-2.5 py-1 text-xs font-medium rounded transition-all',
                              getResponseFormat(code, contentType) === 'beauty'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            ]"
                            @click="setResponseFormat(code, contentType, 'beauty')"
                          >
                            Beauty
                          </button>
                          <button
                            :class="[
                              'px-2.5 py-1 text-xs font-medium rounded transition-all',
                              getResponseFormat(code, contentType) === 'json'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            ]"
                            @click="setResponseFormat(code, contentType, 'json')"
                          >
                            JSON
                          </button>
                        </div>
                      </div>
                    </div>
                    <SchemaView
                      v-if="mediaType?.schema && getResponseFormat(code, contentType) === 'beauty'"
                      :schema="mediaType.schema"
                      title="Schema"
                      :resolver="resolver"
                    />
                    <div
                      v-if="mediaType?.schema && getResponseFormat(code, contentType) === 'json'"
                      class="mt-2 space-y-2"
                    >
                      <div class="flex items-center justify-between">
                        <h4 class="text-sm font-semibold">Schema</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          class="h-7 px-2 text-xs"
                          @click="handleCopySchemaJson(code, contentType, mediaType.schema)"
                        >
                          <Check v-if="getCopiedState(code, contentType)" class="w-3.5 h-3.5" />
                          <Copy v-else class="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <div class="relative">
                        <pre class="bg-code-bg border border-code-border rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>{{ getSchemaAsJson(mediaType.schema) }}</code></pre>
                      </div>
                    </div>
                    <div
                      v-if="mediaType?.examples && Object.keys(mediaType.examples).length > 0"
                      class="space-y-2"
                    >
                      <h4 class="text-sm font-semibold">Examples:</h4>
                      <div
                        v-for="[exName, ex] in Object.entries(mediaType.examples)"
                        :key="exName"
                      >
                        <Badge variant="secondary" class="mb-1">{{ exName }}</Badge>
                        <p v-if="resolver.resolve(ex).description" class="text-sm text-muted-foreground">
                          {{ resolver.resolve(ex).description }}
                        </p>
                        <pre
                          v-if="resolver.resolve(ex).value !== undefined"
                          class="bg-code-bg border border-code-border rounded-lg p-3 overflow-x-auto text-xs"
                        >
                          {{ JSON.stringify(resolver.resolve(ex).value, null, 2) }}
                        </pre>
                      </div>
                    </div>
                  </div>
                  
                  <LinksView
                    v-if="resolver.resolve(response).links"
                    :links="resolver.resolve(response).links!"
                    :resolver="resolver"
                  />
                </div>
              </div>
            </Card>
          </template>

          <!-- Callbacks -->
          <template v-if="operation.callbacks && Object.keys(operation.callbacks).length > 0">
            <Separator />
            <CallbacksView :callbacks="operation.callbacks" :resolver="resolver" />
          </template>
        </div>
      </ScrollArea>

      <!-- Try It Out (Right Column) -->
      <ScrollArea class="h-full [&>div::-webkit-scrollbar]:hidden [&>div]:[scrollbar-width:none]">
        <div class="space-y-6 pl-4">
          <!-- Security (Authorization) -->
          <template v-if="operation.security && operation.security.length > 0">
            <Separator />
            <Card class="p-6 space-y-4">
              <div class="flex items-center gap-2">
                <Key class="w-5 h-5 text-primary" />
                <h3 class="text-lg font-semibold text-foreground">Authorization</h3>
              </div>
              <div class="space-y-2">
                <div
                  v-for="(sec, idx) in operation.security"
                  :key="idx"
                  class="space-y-2"
                >
                  <div
                    v-for="[scheme, scopes] in Object.entries(sec)"
                    :key="scheme"
                    class="space-y-2"
                  >
                    <div class="flex items-center gap-2">
                      <Badge variant="outline">{{ scheme }}</Badge>
                      <span v-if="scopes.length > 0" class="text-sm text-muted-foreground">
                        Scopes: {{ scopes.join(', ') }}
                      </span>
                    </div>
                    <Input
                      :model-value="localAuthorizationCredentials[scheme] || ''"
                      @update:model-value="(val: string) => updateLocalAuthorizationCredential(scheme, val)"
                      :placeholder="`Enter ${scheme} credentials`"
                      type="password"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </template>
          <Separator />

          <!-- Server URL -->
          <Card class="p-6 space-y-4">
            <div class="flex items-center gap-2">
              <Server :class="isExampleMode ? 'w-5 h-5 text-muted-foreground' : 'w-5 h-5 text-primary'" />
              <h3 :class="isExampleMode ? 'text-lg font-semibold text-muted-foreground' : 'text-lg font-semibold text-foreground'">Server URL</h3>
            </div>
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
                  :disabled="isExampleMode"
                  class="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  :for="`server-${idx}`"
                  :class="isExampleMode ? 'flex-1 text-sm cursor-not-allowed text-muted-foreground' : 'flex-1 text-sm cursor-pointer'"
                >
                  <div class="font-medium text-foreground">{{ server.url }}</div>
                  <div v-if="server.label.includes('(')" class="text-xs text-muted-foreground">
                    {{ server.label.match(/\(([^)]+)\)/)?.[1] || '' }}
                  </div>
                </label>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  id="server-current-host"
                  value="current-host"
                  :checked="selectedServer === 'current-host'"
                  @change="handleServerSelect('current-host')"
                  :disabled="isExampleMode"
                  class="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  for="server-current-host"
                  :class="isExampleMode ? 'flex-1 text-sm cursor-not-allowed font-medium text-muted-foreground' : 'flex-1 text-sm cursor-pointer font-medium text-foreground'"
                >
                  Current Host ({{ getCurrentHostUrl() }})
                </label>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="radio"
                  id="server-custom"
                  value="custom"
                  :checked="selectedServer === 'custom'"
                  @change="handleServerSelect('custom')"
                  :disabled="isExampleMode"
                  class="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  for="server-custom"
                  :class="isExampleMode ? 'flex-1 text-sm cursor-not-allowed font-medium text-muted-foreground' : 'flex-1 text-sm cursor-pointer font-medium text-foreground'"
                >
                  Custom URL...
                </label>
              </div>
            </div>
            <Input
              :model-value="getCurrentServerUrl()"
              @update:model-value="handleServerUrlUpdate"
              :disabled="isExampleMode || (selectedServer !== 'custom' && selectedServer !== 'current-host' && availableServers.length > 0)"
              placeholder="https://api.example.com"
            />
          </Card>
          <Separator />

          <!-- Params -->
          <template v-if="!isExampleMode">
            <TryItOut 
              :method="method" 
              :path="path" 
              :operation="operation" 
              :spec="spec" 
              :source-url="sourceUrl"
              :server-url="getCurrentServerUrl()"
              :authorization-credentials="getAuthorizationCredentials"
              @response="handleResponse"
            />
          </template>
          <template v-else>
            <Card class="p-6 space-y-4">
              <div class="flex items-center gap-2">
                <Settings class="w-5 h-5 text-muted-foreground" />
                <h3 class="text-lg font-semibold text-muted-foreground">Try It Out</h3>
              </div>
              <div class="p-4 bg-muted rounded-lg border border-border">
                <p class="text-sm text-muted-foreground text-center">
                  Try It Out functionality is disabled in Example mode
                </p>
              </div>
            </Card>
          </template>
          <Separator />

          <!-- Response -->
          <Card class="p-6 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <FileText class="w-5 h-5 text-primary" />
                <h3 class="text-lg font-semibold text-foreground">Response</h3>
              </div>
              <Button
                v-if="response"
                variant="ghost"
                size="sm"
                @click="handleCopy(JSON.stringify(response, null, 2))"
              >
                <Check v-if="copied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
              </Button>
            </div>

            <div v-if="!response" class="text-sm text-muted-foreground text-center py-8">
              No response yet. Execute a request to see the response here.
            </div>

            <template v-else>
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
            </template>
          </Card>
        </div>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { Copy, Check, Key, Server, FileText, Settings } from 'lucide-vue-next'
import type { Operation, OpenAPISpec, PathItem } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import { isOperationPrivate } from '@/utils/openapi-parser'
import { getMethodColorClass } from '@/utils/operation-cache'
import { useAuthorizationStore } from '@/stores/authorization'
import Badge from './ui/Badge.vue'
import Card from './ui/Card.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import ScrollArea from './ui/ScrollArea.vue'
import Separator from './ui/Separator.vue'
import Tabs from './ui/Tabs.vue'
import TabsList from './ui/TabsList.vue'
import TabsTrigger from './ui/TabsTrigger.vue'
import TabsContent from './ui/TabsContent.vue'
import SchemaView from './SchemaView.vue'
import CallbacksView from './CallbacksView.vue'
import LinksView from './LinksView.vue'
import ServersView from './ServersView.vue'
import TryItOut from './TryItOut.vue'

interface Props {
  method: string
  path: string
  operation: Operation
  spec: OpenAPISpec
  sourceUrl?: string
}

const props = defineProps<Props>()

const resolver = new RefResolver(props.spec)
const resolvedBody = computed(() => {
  if (!props.operation.requestBody) return null
  return resolver.resolve(props.operation.requestBody)
})

// Get pathItem for security check
const pathItem = computed(() => {
  return props.spec.paths[props.path] as PathItem | undefined
})

// Check if operation is private
const isPrivate = computed(() => {
  return isOperationPrivate(props.operation, pathItem.value, props.spec)
})

// Check if Example mode is enabled
const isExampleMode = computed(() => {
  return import.meta.env.VITE_EXAMPLE === 'true'
})

// Server URL management
const customServerUrl = ref('')
const response = ref<any>(null)
const copied = ref(false)
const responseTab = ref('body')

// Format selection for Responses schemas (JSON or Beauty)
// Key format: `${code}-${contentType}`
const responseSchemaFormats = ref<Map<string, 'json' | 'beauty'>>(new Map())

// Track copied state for each schema JSON
const schemaJsonCopied = ref<Map<string, boolean>>(new Map())

// Authorization management
const authorizationStore = useAuthorizationStore()

// Local authorization credentials (not saved globally)
const localAuthorizationCredentials = ref<Record<string, string>>({})


// Initialize local credentials from global store
const initializeLocalCredentials = () => {
  const globalCredentials = authorizationStore.getCredentials(props.spec, props.sourceUrl)
  localAuthorizationCredentials.value = { ...globalCredentials }
}

// Update local authorization credential
const updateLocalAuthorizationCredential = (scheme: string, credential: string) => {
  localAuthorizationCredentials.value = {
    ...localAuthorizationCredentials.value,
    [scheme]: credential,
  }
}

// Get all authorization credentials (local, fallback to global)
const getAuthorizationCredentials = computed(() => {
  return localAuthorizationCredentials.value
})

// Watch for spec changes and reinitialize
watch(() => [props.spec, props.sourceUrl], () => {
  initializeLocalCredentials()
}, { immediate: true })


// Initialize on mount
onMounted(() => {
  initializeLocalCredentials()
})

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
    props.operation.servers.forEach((server) => {
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
    props.spec.servers.forEach((server) => {
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
  } else if (selectedServer.value === 'current-host') {
    // If editing current-host URL and it doesn't match, switch to custom
    const currentHost = getCurrentHostUrl()
    if (value !== currentHost && value.trim() !== '') {
      selectedServer.value = 'custom'
      customServerUrl.value = value
    }
  } else {
    // Check if the entered URL matches any available server
    const matchingServer = availableServers.value.find(s => s.url === value)
    if (matchingServer) {
      // If it matches a server, select that server
      selectedServer.value = matchingServer.url
    } else if (value === getCurrentHostUrl()) {
      // If it matches current host, select current-host
      selectedServer.value = 'current-host'
    } else if (value.trim() !== '') {
      // If it doesn't match and is not empty, select custom
      selectedServer.value = 'custom'
      customServerUrl.value = value
    }
  }
}

// Get current host URL
const getCurrentHostUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`
  }
  return ''
}

// Get current server URL for display
const getCurrentServerUrl = (): string => {
  if (selectedServer.value === 'custom') {
    return customServerUrl.value
  }
  if (selectedServer.value === 'current-host') {
    return getCurrentHostUrl()
  }
  return selectedServer.value
}

// Handle response from TryItOut
const handleResponse = (responseData: any) => {
  response.value = responseData
}

// Handle copy
const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// Get response schema format (default to 'beauty')
const getResponseFormat = (code: string, contentType: string): 'json' | 'beauty' => {
  const key = `${code}-${contentType}`
  return responseSchemaFormats.value.get(key) || 'beauty'
}

// Set response schema format
const setResponseFormat = (code: string, contentType: string, format: 'json' | 'beauty') => {
  const key = `${code}-${contentType}`
  responseSchemaFormats.value.set(key, format)
}

// Convert schema to JSON string
const getSchemaAsJson = (schema: any): string => {
  try {
    const resolvedSchema = resolver.resolve(schema)
    return JSON.stringify(resolvedSchema, null, 2)
  } catch (error) {
    return JSON.stringify(schema, null, 2)
  }
}

// Handle copy schema JSON
const handleCopySchemaJson = (code: string, contentType: string, schema: any) => {
  const jsonText = getSchemaAsJson(schema)
  navigator.clipboard.writeText(jsonText)
  const key = `${code}-${contentType}-json`
  schemaJsonCopied.value.set(key, true)
  setTimeout(() => {
    schemaJsonCopied.value.set(key, false)
  }, 2000)
}

// Get copied state for schema JSON
const getCopiedState = (code: string, contentType: string): boolean => {
  const key = `${code}-${contentType}-json`
  return schemaJsonCopied.value.get(key) || false
}
</script>

