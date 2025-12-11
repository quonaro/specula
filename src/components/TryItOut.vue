<template>
  <Card class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Settings class="w-5 h-5 text-primary" />
        <h3 class="text-lg font-semibold text-foreground">Params</h3>
      </div>
      <div class="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          @click="commandFormat = 'edit'"
          :class="commandFormat === 'edit' ? 'bg-muted' : ''"
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="commandFormat = 'curl'"
          :class="commandFormat === 'curl' ? 'bg-muted' : ''"
        >
          cURL
        </Button>
        <Button
          variant="ghost"
          size="sm"
          @click="commandFormat = 'wget'"
          :class="commandFormat === 'wget' ? 'bg-muted' : ''"
        >
          Wget
        </Button>
      </div>
    </div>

    <!-- Edit Mode: Parameters and Request Body -->
    <template v-if="commandFormat === 'edit'">
      <!-- Parameters -->
      <div v-if="hasParameters" class="space-y-3">
        <h4 class="text-sm font-semibold">Parameters</h4>
        <div
          v-for="(param, idx) in parameters"
          :key="idx"
          class="space-y-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <label class="text-sm font-medium">
              {{ resolver.resolve(param).name }}
              <span v-if="getParameterType(param)" :class="`font-normal ${getTypeColorClass(getParameterType(param))}`">
                ({{ getParameterType(param) }})
              </span>
            </label>
            <Badge variant="outline" class="text-xs">
              {{ resolver.resolve(param).in }}
            </Badge>
            <Badge v-if="resolver.resolve(param).required" variant="destructive" class="text-xs">
              required
            </Badge>
            <Badge v-if="isFileParameter(param)" variant="outline" class="text-xs">
              file
            </Badge>
          </div>
          <p v-if="resolver.resolve(param).description" class="text-xs text-muted-foreground">
            {{ resolver.resolve(param).description }}
          </p>
          <!-- File input for binary parameters -->
          <div v-if="isFileParameter(param)" class="space-y-2">
            <input
              type="file"
              :id="`file-param-${idx}`"
              @change="(e: Event) => handleFileParamChange(resolver.resolve(param).name, e)"
              class="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p v-if="paramFileValues[resolver.resolve(param).name]" class="text-xs text-muted-foreground">
              Selected: {{ paramFileValues[resolver.resolve(param).name]?.name }}
            </p>
          </div>
          <!-- Regular input for non-file parameters -->
          <Input
            v-else
            :model-value="paramValues[resolver.resolve(param).name] || ''"
            @update:model-value="(val: string) => updateParamValue(resolver.resolve(param).name, val)"
            :placeholder="`Enter ${resolver.resolve(param).name}`"
          />
        </div>
      </div>

      <!-- Request Body -->
      <div v-if="hasRequestBody" class="space-y-2">
        <h4 class="text-sm font-semibold">Request Body</h4>
        <!-- File upload for binary/multipart request body -->
        <div v-if="isRequestBodyFile" class="space-y-2">
          <input
            type="file"
            id="request-body-file"
            @change="handleRequestBodyFileChange"
            class="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          <p v-if="requestBodyFile" class="text-xs text-muted-foreground">
            Selected: {{ requestBodyFile.name }}
          </p>
        </div>
        <!-- JSON textarea for JSON request body -->
        <Textarea
          v-else
          :model-value="requestBody"
          @update:model-value="requestBody = $event"
          placeholder="Enter JSON request body"
          class="font-mono text-xs min-h-[150px]"
        />
      </div>
    </template>

    <!-- Command Preview (curl/wget) -->
    <template v-else>
      <div class="space-y-2">
        <div class="relative">
          <pre class="bg-code-bg border border-code-border rounded-lg p-3 text-xs overflow-x-auto font-mono min-h-[100px] max-h-[300px] overflow-y-auto">{{ generatedCommand }}</pre>
          <Button
            variant="ghost"
            size="sm"
            @click="handleCopyCommand(generatedCommand)"
            class="absolute top-2 right-2"
          >
            <Check v-if="commandCopied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </template>

    <!-- Execute/Cancel Button -->
    <Button
      @click="isExecuting ? handleCancel() : handleExecute()"
      :disabled="false"
      :variant="isExecuting ? 'destructive' : 'default'"
      class="w-full"
    >
      <X v-if="isExecuting" class="w-4 h-4 mr-2" />
      <Play v-else class="w-4 h-4 mr-2" />
      {{ isExecuting ? 'Cancel' : 'Execute' }}
    </Button>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Play, Copy, Check, Settings, X } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import Textarea from './ui/Textarea.vue'
import Badge from './ui/Badge.vue'
import { useToast } from '@/composables/useToast'
import type { Operation, OpenAPISpec, PathItem, SecurityScheme } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import { getOperationSecurity } from '@/utils/openapi-parser'

interface Props {
  method: string
  path: string
  operation: Operation
  spec: OpenAPISpec
  pathItem?: PathItem
  sourceUrl?: string
  serverUrl?: string
  authorizationCredentials?: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  response: [response: any]
}>()

const { toast } = useToast()
const resolver = new RefResolver(props.spec)

// Get effective security requirements for this operation
const operationSecurity = computed(() => {
  return getOperationSecurity(props.operation, props.pathItem, props.spec)
})
const isExecuting = ref(false)
const abortController = ref<AbortController | null>(null)
const response = ref<any>(null)
const paramValues = ref<Record<string, string>>({})
const paramFileValues = ref<Record<string, File>>({})
const requestBody = ref('{}')
const requestBodyFile = ref<File | null>(null)
const commandFormat = ref<'edit' | 'curl' | 'wget'>('edit')
const commandCopied = ref(false)

const parameters = computed(() => props.operation.parameters || [])
const hasParameters = computed(() => parameters.value.length > 0)
const hasRequestBody = computed(() => props.operation.requestBody !== undefined)

// Resolve requestBody to handle $ref
const resolvedBody = computed(() => {
  if (!props.operation.requestBody) return null
  return resolver.resolve(props.operation.requestBody)
})

// Extract example from requestBody
const getRequestBodyExample = (): string => {
  if (!resolvedBody.value || !resolvedBody.value.content) {
    return '{}'
  }

  // Try to find examples in content types (prioritize application/json)
  const contentTypes = Object.keys(resolvedBody.value.content)
  const jsonContentType = contentTypes.find(ct => ct.includes('json')) || contentTypes[0]
  
  if (!jsonContentType) {
    return '{}'
  }

  const mediaType = resolvedBody.value.content[jsonContentType]
  if (!mediaType) {
    return '{}'
  }

  // First, try to get from examples (multiple examples)
  if (mediaType.examples && Object.keys(mediaType.examples).length > 0) {
    const firstExampleKey = Object.keys(mediaType.examples)[0]
    const firstExample = resolver.resolve(mediaType.examples[firstExampleKey])
    if (firstExample?.value !== undefined) {
      return JSON.stringify(firstExample.value, null, 2)
    }
  }

  // Second, try to get from single example
  if (mediaType.example !== undefined) {
    return JSON.stringify(mediaType.example, null, 2)
  }

  // If no examples, try to generate from schema
  if (mediaType.schema) {
    const schema = resolver.resolve(mediaType.schema)
    const generatedExample = generateExampleFromSchema(schema)
    if (generatedExample) {
      return JSON.stringify(generatedExample, null, 2)
    }
  }

  return '{}'
}

// Generate example from schema
const generateExampleFromSchema = (schema: any): any => {
  if (!schema) return null

  const resolvedSchema = resolver.resolve(schema)

  // Handle resolution errors (circular refs, external refs, not found)
  if (resolvedSchema.__circular || resolvedSchema.__external || resolvedSchema.__notFound) {
    return null
  }

  // Handle allOf, oneOf, anyOf
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

  // Handle different types
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
      return itemExample !== null ? [itemExample] : null
    }
    return []
  }

  // Handle primitive types with defaults or examples
  if (resolvedSchema.default !== undefined) {
    return resolvedSchema.default
  }

  if (resolvedSchema.example !== undefined) {
    return resolvedSchema.example
  }

  // Generate based on type
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

const updateParamValue = (name: string, value: string) => {
  paramValues.value = { ...paramValues.value, [name]: value }
}

// Get parameter type from schema
const getParameterType = (param: any): string => {
  const resolved = resolver.resolve(param)
  if (!resolved.schema) return ''
  
  const schema = resolver.resolve(resolved.schema)
  
  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop()
    return refName || ''
  }
  
  // Handle array
  if (schema.type === 'array') {
    if (schema.items) {
      const items = resolver.resolve(schema.items)
      if (items.$ref) {
        const refName = items.$ref.split('/').pop()
        return `array<${refName}>`
      }
      return `array<${items.type || 'any'}>`
    }
    return 'array'
  }
  
  // Handle object
  if (schema.type === 'object') {
    return 'object'
  }
  
  // Handle primitive types
  if (schema.type) {
    return schema.format ? `${schema.type}(${schema.format})` : schema.type
  }
  
  return ''
}

// Get color class for type
const getTypeColorClass = (type: string): string => {
  if (!type) return 'text-muted-foreground'
  
  const lowerType = type.toLowerCase()
  
  // String types - blue
  if (lowerType.startsWith('string') || lowerType.includes('string')) {
    return 'text-blue-400'
  }
  
  // Number types - green
  if (lowerType.includes('number') || lowerType.includes('integer') || lowerType.includes('float') || lowerType.includes('double')) {
    return 'text-green-400'
  }
  
  // Boolean - purple
  if (lowerType.includes('boolean') || lowerType === 'bool') {
    return 'text-purple-400'
  }
  
  // Array - orange
  if (lowerType.startsWith('array')) {
    return 'text-orange-400'
  }
  
  // Object - yellow
  if (lowerType.includes('object')) {
    return 'text-yellow-400'
  }
  
  // Date/time formats - cyan
  if (lowerType.includes('date') || lowerType.includes('time')) {
    return 'text-cyan-400'
  }
  
  // Default - muted
  return 'text-muted-foreground'
}

// Check if parameter is a file (type: string, format: binary)
const isFileParameter = (param: any): boolean => {
  const resolved = resolver.resolve(param)
  if (resolved.schema) {
    const schema = resolver.resolve(resolved.schema)
    return schema.type === 'string' && schema.format === 'binary'
  }
  if (resolved.content) {
    // Check if content type indicates binary
    const contentTypes = Object.keys(resolved.content)
    return contentTypes.some(ct => 
      ct.includes('octet-stream') || 
      ct.includes('binary') ||
      ct.includes('multipart')
    )
  }
  return false
}

// Handle file parameter change
const handleFileParamChange = (name: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    paramFileValues.value = { ...paramFileValues.value, [name]: file }
    // Clear text value for this parameter
    const { [name]: _, ...rest } = paramValues.value
    paramValues.value = rest
  } else {
    const { [name]: _, ...rest } = paramFileValues.value
    paramFileValues.value = rest
  }
}

// Check if request body should be a file
const isRequestBodyFile = computed(() => {
  if (!resolvedBody.value || !resolvedBody.value.content) {
    return false
  }
  const contentTypes = Object.keys(resolvedBody.value.content)
  return contentTypes.some(ct => 
    ct.includes('multipart/form-data') || 
    ct.includes('application/octet-stream') ||
    ct.includes('*/*')
  )
})

// Handle request body file change
const handleRequestBodyFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  requestBodyFile.value = file || null
  if (file) {
    requestBody.value = ''
  }
}

// Initialize requestBody with example when component mounts or operation changes
const initializeRequestBody = () => {
  if (hasRequestBody.value) {
    const example = getRequestBodyExample()
    requestBody.value = example
  }
}

// Watch for operation changes and reinitialize
watch(() => [props.operation, props.path, props.method], () => {
  initializeRequestBody()
  // Clear file values when operation changes
  paramFileValues.value = {}
  requestBodyFile.value = null
}, { immediate: false, deep: false })

// Initialize on mount
onMounted(() => {
  initializeRequestBody()
})

// Build request URL with path and query parameters
const buildRequestUrl = (): string => {
  const serverUrl = props.serverUrl || ''
  if (!serverUrl) return ''
  
  let url = serverUrl + props.path
  const queryParams: string[] = []

  // Add authorization query parameters according to OpenAPI spec
  if (props.authorizationCredentials && operationSecurity.value) {
    operationSecurity.value.forEach((sec) => {
      Object.keys(sec).forEach((scheme) => {
        const credential = props.authorizationCredentials?.[scheme]
        if (credential) {
          const securityScheme = props.spec.components?.securitySchemes?.[scheme]
          if (securityScheme) {
            // Only add query parameters here (cookies and headers handled separately)
            if (securityScheme.type === 'apiKey' && securityScheme.in === 'query') {
              const name = securityScheme.name || scheme
              queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(credential)}`)
            }
          }
        }
      })
    })
  }

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
  
  return url
}

// Get request headers and cookies
const getRequestHeaders = (): { headers: Record<string, string>; cookies: string[] } => {
  const headers: Record<string, string> = {}
  const cookies: string[] = []
  
  // Add authorization headers according to OpenAPI SecurityScheme specification
  if (props.authorizationCredentials && operationSecurity.value) {
    operationSecurity.value.forEach((sec) => {
      Object.keys(sec).forEach((scheme) => {
        const credential = props.authorizationCredentials?.[scheme]
        if (credential) {
          const securityScheme = props.spec.components?.securitySchemes?.[scheme]
          if (securityScheme) {
            // Handle different security scheme types
            switch (securityScheme.type) {
              case 'http':
                // HTTP authentication (basic, bearer, digest, etc.)
                const httpScheme = securityScheme.scheme || 'bearer'
                if (httpScheme.toLowerCase() === 'bearer') {
                  // Bearer token authentication
                  const bearerFormat = securityScheme.bearerFormat
                  headers['Authorization'] = bearerFormat 
                    ? `${bearerFormat} ${credential}`
                    : `Bearer ${credential}`
                } else if (httpScheme.toLowerCase() === 'basic') {
                  // Basic authentication
                  headers['Authorization'] = `Basic ${credential}`
                } else {
                  // Other HTTP schemes (digest, etc.)
                  headers['Authorization'] = `${httpScheme} ${credential}`
                }
                break

              case 'oauth2':
              case 'openIdConnect':
                // OAuth2 and OpenID Connect use Bearer token
                headers['Authorization'] = `Bearer ${credential}`
                break

              case 'apiKey':
                // API Key authentication
                const name = securityScheme.name || scheme
                const inLocation = securityScheme.in || 'header'
                if (inLocation === 'header') {
                  headers[name] = credential
                } else if (inLocation === 'query') {
                  // Query params are handled separately in buildRequestUrl
                } else if (inLocation === 'cookie') {
                  // Cookies are handled separately
                  cookies.push(`${encodeURIComponent(name)}=${encodeURIComponent(credential)}`)
                }
                break

              default:
                // Fallback: use scheme name as header name
                headers[scheme] = credential
                break
            }
          } else {
            // If security scheme not found, try to infer from scheme name
            if (scheme.toLowerCase().includes('bearer')) {
              headers['Authorization'] = `Bearer ${credential}`
            } else {
              headers[scheme] = credential
            }
          }
        }
      })
    })
  }
  
  // Add header parameters
  parameters.value.forEach((param) => {
    const resolvedParam = resolver.resolve(param)
    const value = paramValues.value[resolvedParam.name]
    if (value && resolvedParam.in === 'header') {
      headers[resolvedParam.name] = value
    }
  })
  
  // Add content type if needed
  if (hasRequestBody.value && resolvedBody.value?.content) {
    const requestBodyContentType = Object.keys(resolvedBody.value.content)[0]
    const isMultipartBody = requestBodyContentType?.includes('multipart/form-data')
    const isOctetStreamBody = requestBodyContentType?.includes('application/octet-stream') || 
                              requestBodyContentType?.includes('*/*')
    
    if (!isMultipartBody) {
      if (isOctetStreamBody && requestBodyFile.value) {
        headers['Content-Type'] = requestBodyContentType || 'application/octet-stream'
      } else if (!isRequestBodyFile.value && requestBody.value) {
        headers['Content-Type'] = 'application/json'
      }
    }
  }
  
  // Add cookies to Cookie header if any
  if (cookies.length > 0) {
    headers['Cookie'] = cookies.join('; ')
  }
  
  return { headers, cookies }
}

// Generate curl command
const generateCurlCommand = (): string => {
  const url = buildRequestUrl()
  if (!url) return '# No server URL configured'
  
  const method = props.method.toUpperCase()
  const { headers, cookies } = getRequestHeaders()
  const parts: string[] = ['curl']
  
  // Add method
  if (method !== 'GET') {
    parts.push(`-X ${method}`)
  }
  
  // Add headers
  Object.entries(headers).forEach(([key, value]) => {
    parts.push(`-H "${key}: ${value}"`)
  })
  
  // Add cookies if any
  if (cookies.length > 0) {
    parts.push(`-H "Cookie: ${cookies.join('; ')}"`)
  }
  
  // Handle request body
  const hasFileParams = Object.keys(paramFileValues.value).length > 0
  const hasFileRequestBody = requestBodyFile.value !== null
  
  if (hasFileParams || (hasFileRequestBody && isRequestBodyFile.value)) {
    // For multipart/form-data, we need to add form fields
    const requestBodyContentType = hasRequestBody.value && resolvedBody.value?.content 
      ? Object.keys(resolvedBody.value.content)[0] 
      : null
    const isMultipartBody = requestBodyContentType?.includes('multipart/form-data')
    
    if (isMultipartBody || hasFileParams) {
      // Add file parameters
      parameters.value.forEach((param) => {
        const resolvedParam = resolver.resolve(param)
        const file = paramFileValues.value[resolvedParam.name]
        if (file) {
          parts.push(`-F "${resolvedParam.name}=@${file.name}"`)
        } else {
          const value = paramValues.value[resolvedParam.name]
          if (value && resolvedParam.in !== 'header' && resolvedParam.in !== 'path' && resolvedParam.in !== 'query') {
            parts.push(`-F "${resolvedParam.name}=${value}"`)
          }
        }
      })
      
      // Add request body file
      if (hasFileRequestBody && requestBodyFile.value && isMultipartBody) {
        parts.push(`-F "file=@${requestBodyFile.value.name}"`)
      }
    } else if (hasFileRequestBody && requestBodyFile.value) {
      // Binary file upload
      parts.push(`--data-binary "@${requestBodyFile.value.name}"`)
    }
  } else if (hasRequestBody.value && requestBody.value && method !== 'GET' && method !== 'HEAD') {
    // JSON body
    try {
      const bodyObj = JSON.parse(requestBody.value)
      const bodyStr = JSON.stringify(bodyObj)
      // Escape single quotes and wrap in single quotes, or use double quotes
      const escapedBody = bodyStr.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
      parts.push(`-d '${escapedBody}'`)
    } catch {
      // If not valid JSON, escape and use as-is
      const escapedBody = requestBody.value.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
      parts.push(`-d '${escapedBody}'`)
    }
  }
  
  // Add URL
  parts.push(`"${url}"`)
  
  return parts.join(' \\\n  ')
}

// Generate wget command
const generateWgetCommand = (): string => {
  const url = buildRequestUrl()
  if (!url) return '# No server URL configured'
  
  const method = props.method.toUpperCase()
  const { headers, cookies } = getRequestHeaders()
  const parts: string[] = ['wget']
  
  // Wget doesn't support all HTTP methods well, so we use --method
  if (method !== 'GET') {
    parts.push(`--method=${method}`)
  }
  
  // Add headers
  Object.entries(headers).forEach(([key, value]) => {
    parts.push(`--header="${key}: ${value}"`)
  })
  
  // Add cookies if any
  if (cookies.length > 0) {
    parts.push(`--header="Cookie: ${cookies.join('; ')}"`)
  }
  
  // Handle request body
  const hasFileParams = Object.keys(paramFileValues.value).length > 0
  const hasFileRequestBody = requestBodyFile.value !== null
  
  if (hasFileParams || (hasFileRequestBody && isRequestBodyFile.value)) {
    // Wget has limited support for multipart/form-data
    // We'll show a note about this limitation
    const requestBodyContentType = hasRequestBody.value && resolvedBody.value?.content 
      ? Object.keys(resolvedBody.value.content)[0] 
      : null
    const isMultipartBody = requestBodyContentType?.includes('multipart/form-data')
    
    if (isMultipartBody || hasFileParams) {
      // Generate curl command as alternative
      const curlCmd = generateCurlCommand()
      return `# Wget has limited support for multipart/form-data and file uploads.\n# Consider using curl for file uploads:\n#\n# ${curlCmd.replace(/\n/g, '\n# ')}`
    } else if (hasFileRequestBody && requestBodyFile.value) {
      parts.push(`--body-file="${requestBodyFile.value.name}"`)
    }
  } else if (hasRequestBody.value && requestBody.value && method !== 'GET' && method !== 'HEAD') {
    // JSON body - use --post-data
    try {
      const bodyObj = JSON.parse(requestBody.value)
      const bodyStr = JSON.stringify(bodyObj)
      // Escape single quotes and wrap in single quotes
      const escapedBody = bodyStr.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
      parts.push(`--post-data='${escapedBody}'`)
    } catch {
      // If not valid JSON, escape and use as-is
      const escapedBody = requestBody.value.replace(/\\/g, '\\\\').replace(/'/g, "'\\''")
      parts.push(`--post-data='${escapedBody}'`)
    }
  }
  
  // Add URL
  parts.push(`"${url}"`)
  
  return parts.join(' \\\n  ')
}

// Computed property for generated command
const generatedCommand = computed(() => {
  if (commandFormat.value === 'edit') {
    return ''
  } else if (commandFormat.value === 'curl') {
    return generateCurlCommand()
  } else {
    return generateWgetCommand()
  }
})

// Handle copy command
const handleCopyCommand = (command: string) => {
  navigator.clipboard.writeText(command)
  commandCopied.value = true
  setTimeout(() => {
    commandCopied.value = false
  }, 2000)
  toast({
    title: 'Copied!',
    description: 'Command copied to clipboard',
  })
}

const handleCancel = () => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isExecuting.value = false
  toast({
    title: 'Request Cancelled',
    description: 'The request has been cancelled',
  })
}

const handleExecute = async () => {
  isExecuting.value = true
  response.value = null
  
  // Create new AbortController for this request
  abortController.value = new AbortController()

  try {
    const serverUrl = props.serverUrl || ''
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

    // Add authorization query parameters according to OpenAPI spec
    if (props.authorizationCredentials && operationSecurity.value) {
      operationSecurity.value.forEach((sec) => {
        Object.keys(sec).forEach((scheme) => {
          const credential = props.authorizationCredentials?.[scheme]
          if (credential) {
            const securityScheme = props.spec.components?.securitySchemes?.[scheme]
            if (securityScheme) {
              // Only add query parameters here (cookies and headers handled separately)
              if (securityScheme.type === 'apiKey' && securityScheme.in === 'query') {
                const name = securityScheme.name || scheme
                queryParams.push(`${encodeURIComponent(name)}=${encodeURIComponent(credential)}`)
              }
            }
          }
        })
      })
    }

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

    // Check if we have file parameters or file request body
    const hasFileParams = Object.keys(paramFileValues.value).length > 0
    const hasFileRequestBody = requestBodyFile.value !== null
    
    // Determine content type for request body
    const requestBodyContentType = hasRequestBody.value && resolvedBody.value?.content 
      ? Object.keys(resolvedBody.value.content)[0] 
      : null
    const isMultipartBody = requestBodyContentType?.includes('multipart/form-data')
    const isOctetStreamBody = requestBodyContentType?.includes('application/octet-stream') || 
                              requestBodyContentType?.includes('*/*')

    // Get authorization headers and cookies
    const { headers: authHeaders, cookies } = getRequestHeaders()
    const headers: Record<string, string> = { ...authHeaders }
    let body: BodyInit | undefined

    // Handle header parameters (always add them, may override auth headers)
    parameters.value.forEach((param) => {
      const resolvedParam = resolver.resolve(param)
      const value = paramValues.value[resolvedParam.name]
      if (value && resolvedParam.in === 'header') {
        headers[resolvedParam.name] = value
      }
    })

    // Handle file request body with application/octet-stream (send file directly)
    if (hasFileRequestBody && requestBodyFile.value && isOctetStreamBody && !isMultipartBody) {
      body = requestBodyFile.value
      headers['Content-Type'] = requestBodyContentType || 'application/octet-stream'
    }
    // Handle multipart/form-data or file parameters (use FormData)
    else if (hasFileParams || (hasFileRequestBody && isMultipartBody)) {
      const formData = new FormData()

      // Add file parameters to FormData
      parameters.value.forEach((param) => {
        const resolvedParam = resolver.resolve(param)
        const file = paramFileValues.value[resolvedParam.name]
        if (file) {
          formData.append(resolvedParam.name, file)
        } else {
          const value = paramValues.value[resolvedParam.name]
          if (value && resolvedParam.in !== 'header' && resolvedParam.in !== 'path' && resolvedParam.in !== 'query') {
            formData.append(resolvedParam.name, value)
          }
        }
      })

      // Add request body file to FormData
      if (hasFileRequestBody && requestBodyFile.value && isMultipartBody) {
        const mediaType = resolvedBody.value?.content[requestBodyContentType!]
        if (mediaType?.schema) {
          const schema = resolver.resolve(mediaType.schema)
          if (schema.type === 'object' && schema.properties) {
            // Find file property
            const fileProp = Object.keys(schema.properties).find(key => {
              const propSchema = resolver.resolve(schema.properties![key])
              return propSchema.type === 'string' && propSchema.format === 'binary'
            })
            if (fileProp) {
              formData.append(fileProp, requestBodyFile.value)
            } else {
              formData.append('file', requestBodyFile.value)
            }
          } else {
            formData.append('file', requestBodyFile.value)
          }
        } else {
          formData.append('file', requestBodyFile.value)
        }
      }

      body = formData
      // Don't set Content-Type header for FormData - browser will set it with boundary
    }
    // Regular JSON request
    else {
      headers['Content-Type'] = 'application/json'

      // Add request body for non-GET/HEAD requests
      if (props.method.toLowerCase() !== 'get' && props.method.toLowerCase() !== 'head') {
        if (hasRequestBody.value && requestBody.value) {
          try {
            const bodyObj = JSON.parse(requestBody.value)
            body = JSON.stringify(bodyObj)
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
      }
    }

    const options: RequestInit = {
      method: props.method.toUpperCase(),
      headers,
      signal: abortController.value.signal,
    }

    if (body !== undefined) {
      options.body = body
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

    const responsePayload = {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
      data: responseData,
      duration,
      url,
    }

    response.value = responsePayload
    emit('response', responsePayload)

    toast({
      title: `Response: ${res.status}`,
      description: `Request completed in ${duration}ms`,
    })
  } catch (error: any) {
    // Don't show error if request was aborted
    if (error.name === 'AbortError') {
      isExecuting.value = false
      abortController.value = null
      return
    }
    
    const serverUrl = props.serverUrl || ''
    response.value = {
      error: true,
      message: error.message,
      url: (serverUrl || '') + props.path,
    }

    emit('response', response.value)
    
    toast({
      title: 'Request Failed',
      description: error.message,
      variant: 'destructive',
    })
  } finally {
    isExecuting.value = false
    abortController.value = null
  }
}

</script>

