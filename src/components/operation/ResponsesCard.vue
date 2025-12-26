<template>
  <Card class="p-6 space-y-4">
    <div class="flex items-center gap-2">
      <FileText class="w-5 h-5 text-primary" />
      <h3 class="text-lg font-semibold text-foreground">Responses</h3>
    </div>
    <div class="space-y-4">
      <div v-for="[code, response] in Object.entries(operation.responses)" :key="code"
        class="border border-border rounded-lg p-4 space-y-3">
        <div class="flex items-center gap-2">
          <Badge variant="none" :class="`${getStatusColorClass(code)} text-white font-bold`">
            {{ code }}
          </Badge>
          <span class="text-sm text-foreground">
            {{ resolver.resolve(response).description }}
          </span>
        </div>

        <div
          v-if="resolver.resolve(response).headers && Object.keys(resolver.resolve(response).headers || {}).length > 0"
          class="space-y-2">
          <h4 class="text-sm font-semibold">Headers:</h4>
          <div v-for="[headerName, header] in Object.entries(resolver.resolve(response).headers || {})"
            :key="headerName" class="text-sm">
            <code class="font-semibold">{{ headerName }}</code>
            <span v-if="resolver.resolve(header).description" class="text-muted-foreground ml-2">
              - {{ resolver.resolve(header).description }}
            </span>
          </div>
        </div>

        <div v-if="resolver.resolve(response).content"
          v-for="[contentType, mediaType] in getMediaTypeEntries(resolver.resolve(response).content)"
          :key="contentType" class="space-y-2">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium text-foreground">
              Content-Type: <code>{{ contentType }}</code>
            </div>
            <div v-if="mediaType?.schema" class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">Format:</span>
              <div class="inline-flex gap-0.5 bg-muted rounded-md p-0.5 border border-border">
                <button :class="[
                  'px-2.5 py-1 text-xs font-medium rounded transition-all',
                  getResponseFormat(code, contentType) === 'beauty'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]" @click="setResponseFormat(code, contentType, 'beauty')">
                  Beauty
                </button>
                <button :class="[
                  'px-2.5 py-1 text-xs font-medium rounded transition-all',
                  getResponseFormat(code, contentType) === 'response'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]" @click="setResponseFormat(code, contentType, 'response')">
                  Response
                </button>
                <button :class="[
                  'px-2.5 py-1 text-xs font-medium rounded transition-all',
                  getResponseFormat(code, contentType) === 'metadata'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                ]" @click="setResponseFormat(code, contentType, 'metadata')">
                  Metadata
                </button>
              </div>
            </div>
          </div>
          <SchemaView v-if="mediaType?.schema && getResponseFormat(code, contentType) === 'beauty'"
            :schema="mediaType.schema" title="Schema" :resolver="resolver" />
          <div v-if="mediaType?.schema && getResponseFormat(code, contentType) === 'response'"
            class="mt-2 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold">Response Example</h4>
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs"
                @click="handleCopyResponseExample(code, contentType, mediaType.schema)">
                <Check v-if="getCopiedResponseState(code, contentType)" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
              </Button>
            </div>
            <div class="relative">
              <pre
                class="bg-code-bg border border-code-border rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>{{ getResponseExampleJson(mediaType.schema) }}</code></pre>
            </div>
          </div>
          <div v-if="mediaType?.schema && getResponseFormat(code, contentType) === 'metadata'"
            class="mt-2 space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold">Schema</h4>
              <Button variant="ghost" size="sm" class="h-7 px-2 text-xs"
                @click="handleCopySchemaJson(code, contentType, mediaType.schema)">
                <Check v-if="getCopiedState(code, contentType)" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
              </Button>
            </div>
            <div class="relative">
              <pre
                class="bg-code-bg border border-code-border rounded-lg p-4 overflow-x-auto text-xs font-mono leading-relaxed"><code>{{ getSchemaAsJson(mediaType.schema) }}</code></pre>
            </div>
          </div>
          <div v-if="mediaType?.examples && Object.keys(mediaType.examples).length > 0" class="space-y-2">
            <h4 class="text-sm font-semibold">Examples:</h4>
            <div v-for="[exName, ex] in Object.entries(mediaType.examples || {})" :key="exName">
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
        </div>

        <LinksView v-if="resolver.resolve(response).links" :links="resolver.resolve(response).links!"
          :resolver="resolver" />
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { Copy, Check, FileText } from 'lucide-vue-next'
import type { Operation, OpenAPISpec, MediaType } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import { getStatusColorClass } from '@/utils/operation-cache'
import { useToast } from '@/composables/useToast'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import Button from '../ui/Button.vue'
import SchemaView from '../SchemaView.vue'
import LinksView from '../LinksView.vue'

interface Props {
  operation: Operation
  spec: OpenAPISpec
}

const props = defineProps<Props>()

const resolver = new RefResolver(props.spec)
const { toast } = useToast()

// Format selection for Responses schemas (Beauty, Response, Metadata)
const responseSchemaFormats = ref<Map<string, 'beauty' | 'response' | 'metadata'>>(new Map())

// Track copied state for each schema JSON (Metadata format)
const schemaJsonCopied = ref<Map<string, boolean>>(new Map())
// Track copied state for each response example (Response format)
const responseExampleCopied = ref<Map<string, boolean>>(new Map())

// Cache for expensive JSON generation operations
const schemaJsonCache = ref<Map<string, string>>(new Map())
const responseExampleCache = ref<Map<string, string>>(new Map())

// Watch for operation changes and clear caches
watch(() => [props.operation], () => {
  schemaJsonCache.value.clear()
  responseExampleCache.value.clear()
}, { immediate: false, deep: false })

// Helper functions for type-safe Object.entries
const getMediaTypeEntries = (content: Record<string, any> | undefined): Array<[string, MediaType]> => {
  if (!content) return []
  return Object.entries(content) as Array<[string, MediaType]>
}

// Get response schema format (default to 'response')
const getResponseFormat = (code: string, contentType: string): 'beauty' | 'response' | 'metadata' => {
  const key = `${code}-${contentType}`
  return responseSchemaFormats.value.get(key) || 'response'
}

// Set response schema format
const setResponseFormat = (code: string, contentType: string, format: 'beauty' | 'response' | 'metadata') => {
  const key = `${code}-${contentType}`
  responseSchemaFormats.value.set(key, format)
}

// Copy text to clipboard with fallback
const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error)
    }
  }

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

// Convert schema to JSON string (for Metadata format) with caching
const getSchemaAsJson = (schema: any): string => {
  try {
    const cacheKey = JSON.stringify(schema)

    if (schemaJsonCache.value.has(cacheKey)) {
      return schemaJsonCache.value.get(cacheKey)!
    }

    const resolvedSchema = resolver.resolve(schema)
    const result = JSON.stringify(resolvedSchema, null, 2)

    if (schemaJsonCache.value.size < 50) {
      schemaJsonCache.value.set(cacheKey, result)
    }

    return result
  } catch (error) {
    const fallback = JSON.stringify(schema, null, 2)
    return fallback
  }
}

// Generate example JSON from schema (for Response format)
const generateExampleFromSchema = (schema: any): any => {
  if (!schema) return null

  const resolvedSchema = resolver.resolve(schema)

  if (resolvedSchema.__circular || resolvedSchema.__external || resolvedSchema.__notFound) {
    return null
  }

  if (resolvedSchema.allOf && resolvedSchema.allOf.length > 0) {
    const merged: any = {}
    resolvedSchema.allOf.forEach((s: any) => {
      const example = generateExampleFromSchema(s)
      if (example && typeof example === 'object') {
        Object.assign(merged, example)
      }
    })
    return Object.keys(merged).length > 0 ? merged : null
  }

  if (resolvedSchema.oneOf && resolvedSchema.oneOf.length > 0) {
    return generateExampleFromSchema(resolvedSchema.oneOf[0])
  }

  if (resolvedSchema.anyOf && resolvedSchema.anyOf.length > 0) {
    return generateExampleFromSchema(resolvedSchema.anyOf[0])
  }

  const type = resolvedSchema.type

  if (type === 'object') {
    const example: any = {}
    if (resolvedSchema.properties) {
      Object.keys(resolvedSchema.properties).forEach(key => {
        const propSchema = resolver.resolve(resolvedSchema.properties[key])
        const propExample = generateExampleFromSchema(propSchema)
        if (propExample !== null && propExample !== undefined) {
          example[key] = propExample
        }
      })
    }
    return Object.keys(example).length > 0 ? example : null
  }

  if (type === 'array') {
    if (resolvedSchema.items) {
      const itemExample = generateExampleFromSchema(resolvedSchema.items)
      if (itemExample !== null) {
        return [itemExample, itemExample, itemExample]
      }
      return null
    }
    return []
  }

  if (resolvedSchema.default !== undefined) {
    return resolvedSchema.default
  }

  if (resolvedSchema.example !== undefined) {
    return resolvedSchema.example
  }

  switch (type) {
    case 'string':
      if (resolvedSchema.enum && resolvedSchema.enum.length > 0) {
        return resolvedSchema.enum[0]
      }
      if (resolvedSchema.format === 'email') return 'user@example.com'
      if (resolvedSchema.format === 'date') return '2024-01-01'
      if (resolvedSchema.format === 'date-time') return '2024-01-01T00:00:00Z'
      if (resolvedSchema.format === 'uri') return 'https://example.com'
      return 'string'
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'null':
      return null
    default:
      return null
  }
}

// Get example response JSON string (for Response format) with caching
const getResponseExampleJson = (schema: any): string => {
  try {
    const cacheKey = JSON.stringify(schema)

    if (responseExampleCache.value.has(cacheKey)) {
      return responseExampleCache.value.get(cacheKey)!
    }

    const example = generateExampleFromSchema(schema)
    if (example === null || example === undefined) {
      return 'null'
    }
    const result = JSON.stringify(example, null, 2)

    if (responseExampleCache.value.size < 50) {
      responseExampleCache.value.set(cacheKey, result)
    }

    return result
  } catch (error) {
    return '{}'
  }
}

// Handle copy schema JSON
const handleCopySchemaJson = async (code: string, contentType: string, schema: any) => {
  const jsonText = getSchemaAsJson(schema)
  const success = await copyToClipboard(jsonText)

  if (success) {
    const key = `${code}-${contentType}-json`
    schemaJsonCopied.value.set(key, true)
    setTimeout(() => {
      schemaJsonCopied.value.set(key, false)
    }, 2000)
    toast({
      title: 'Copied!',
      description: 'Schema JSON copied to clipboard',
    })
  } else {
    toast({
      title: 'Copy Failed',
      description: 'Failed to copy schema JSON to clipboard. Please try selecting and copying manually.',
      variant: 'destructive',
    })
  }
}

// Get copied state for schema JSON (Metadata format)
const getCopiedState = (code: string, contentType: string): boolean => {
  const key = `${code}-${contentType}-json`
  return schemaJsonCopied.value.get(key) || false
}

// Handle copy response example
const handleCopyResponseExample = async (code: string, contentType: string, schema: any) => {
  const exampleJson = getResponseExampleJson(schema)
  const success = await copyToClipboard(exampleJson)

  if (success) {
    const key = `${code}-${contentType}-response`
    responseExampleCopied.value.set(key, true)
    setTimeout(() => {
      responseExampleCopied.value.set(key, false)
    }, 2000)
    toast({
      title: 'Copied!',
      description: 'Response example copied to clipboard',
    })
  } else {
    toast({
      title: 'Copy Failed',
      description: 'Failed to copy response example to clipboard. Please try selecting and copying manually.',
      variant: 'destructive',
    })
  }
}

// Get copied state for response example
const getCopiedResponseState = (code: string, contentType: string): boolean => {
  const key = `${code}-${contentType}-response`
  return responseExampleCopied.value.get(key) || false
}
</script>

