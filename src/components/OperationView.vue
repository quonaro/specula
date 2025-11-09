<template>
  <ScrollArea class="h-screen">
    <div class="p-8 space-y-6 max-w-5xl">
      <!-- Header -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <Badge :class="`${getMethodColorClass(method)} text-white font-bold px-3 py-1`">
            {{ method }}
          </Badge>
          <code class="text-lg font-mono text-foreground">{{ path }}</code>
        </div>
        <h2 v-if="operation.summary" class="text-2xl font-bold text-foreground">
          {{ operation.summary }}
        </h2>
        <p v-if="operation.description" class="text-muted-foreground">
          {{ operation.description }}
        </p>
        <div class="flex gap-2">
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

      <!-- Try It Out -->
      <Separator />
      <TryItOut :method="method" :path="path" :operation="operation" :spec="spec" :source-url="sourceUrl" />

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

      <!-- Security -->
      <template v-if="operation.security && operation.security.length > 0">
        <Separator />
        <Card class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-foreground">Security</h3>
          <div class="space-y-2">
            <div
              v-for="(sec, idx) in operation.security"
              :key="idx"
              class="flex gap-2 flex-wrap"
            >
              <Badge
                v-for="[scheme, scopes] in Object.entries(sec)"
                :key="scheme"
                variant="outline"
              >
                {{ scheme }}{{ scopes.length > 0 ? `: ${scopes.join(', ')}` : '' }}
              </Badge>
            </div>
          </div>
        </Card>
      </template>
    </div>
  </ScrollArea>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Operation, OpenAPISpec } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import Badge from './ui/Badge.vue'
import Card from './ui/Card.vue'
import ScrollArea from './ui/ScrollArea.vue'
import Separator from './ui/Separator.vue'
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

const getMethodColorClass = (method: string) => {
  const colorMap: Record<string, string> = {
    GET: 'bg-method-get',
    POST: 'bg-method-post',
    PUT: 'bg-method-put',
    DELETE: 'bg-method-delete',
    PATCH: 'bg-method-patch',
    OPTIONS: 'bg-method-options',
    HEAD: 'bg-method-head',
    TRACE: 'bg-method-trace',
  }
  return colorMap[method.toUpperCase()] || 'bg-muted'
}
</script>

