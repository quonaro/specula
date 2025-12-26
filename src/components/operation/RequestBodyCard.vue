<template>
  <Card class="p-6 space-y-4">
    <div class="flex items-center gap-2">
      <FileJson class="w-5 h-5 text-primary" />
      <h3 class="text-lg font-semibold text-foreground">Request Body</h3>
    </div>
    <template v-if="resolvedBody">
      <p v-if="resolvedBody.description" class="text-sm text-muted-foreground">
        {{ resolvedBody.description }}
      </p>
      <Badge v-if="resolvedBody.required" variant="destructive" class="text-[10px] px-1.5 py-0">
        required
      </Badge>
      <div v-for="[contentType, mediaType] in getMediaTypeEntries(resolvedBody?.content)" :key="contentType"
        class="space-y-3">
        <div class="text-sm font-medium text-foreground">
          Content-Type: <code>{{ contentType }}</code>
        </div>
        <SchemaView v-if="mediaType?.schema" :schema="mediaType.schema" title="Schema" :resolver="resolver" />
        <div v-if="mediaType?.examples && Object.keys(mediaType.examples).length > 0" class="space-y-2">
          <h4 class="text-sm font-semibold">Examples:</h4>
          <div v-for="[exName, ex] in Object.entries(mediaType.examples)" :key="exName">
            <Badge variant="secondary" class="mb-1">{{ exName }}</Badge>
            <p v-if="resolver.resolve(ex).description" class="text-sm text-muted-foreground">
              {{ resolver.resolve(ex).description }}
            </p>
            <pre v-if="resolver.resolve(ex).value !== undefined"
              class="bg-code-bg border border-code-border rounded-lg p-3 overflow-x-auto text-xs">
              {{ JSON.stringify(resolver.resolve(ex).value, null, 2) }}
            </pre>
          </div>
        </div>
        <div v-if="mediaType?.encoding && Object.keys(mediaType.encoding).length > 0" class="space-y-2">
          <h4 class="text-sm font-semibold">Encoding:</h4>
          <div v-for="[fieldName, encoding] in getEncodingEntries(mediaType.encoding)" :key="fieldName"
            class="border border-border rounded p-2">
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

<script setup lang="ts">
import { computed } from 'vue'
import { FileJson } from 'lucide-vue-next'
import type { Operation, OpenAPISpec, MediaType, Encoding } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import SchemaView from '../SchemaView.vue'

interface Props {
  operation: Operation
  spec: OpenAPISpec
}

const props = defineProps<Props>()

const resolver = new RefResolver(props.spec)

const resolvedBody = computed(() => {
  if (!props.operation.requestBody) return null
  return resolver.resolve(props.operation.requestBody)
})

// Helper functions for type-safe Object.entries
const getMediaTypeEntries = (content: Record<string, any> | undefined): Array<[string, MediaType]> => {
  if (!content) return []
  return Object.entries(content) as Array<[string, MediaType]>
}

const getEncodingEntries = (encoding: Record<string, any> | undefined): Array<[string, Encoding]> => {
  if (!encoding) return []
  return Object.entries(encoding) as Array<[string, Encoding]>
}
</script>

