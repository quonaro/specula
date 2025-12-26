import type { OpenAPISpec, Operation, Parameter, RequestBody, SecurityScheme, Server } from '@/types/openapi'
import { RefResolver } from './ref-resolver'
import { getOperationSecurity, getOperationId } from './openapi-parser'

export interface PostmanCollection {
  info: {
    name: string
    description?: string
    schema: string
    _exporter_id?: string
  }
  item: PostmanItem[]
  auth?: PostmanAuth
  variable?: PostmanVariable[]
  event?: PostmanEvent[]
}

export interface PostmanItem {
  name: string
  request?: PostmanRequest
  response?: PostmanResponse[]
  item?: PostmanItem[]
  description?: string
  event?: PostmanEvent[]
}

export interface PostmanRequest {
  method: string
  header?: PostmanHeader[]
  body?: PostmanBody
  url: PostmanUrl
  description?: string
  auth?: PostmanAuth
}

export interface PostmanUrl {
  raw?: string
  protocol?: string
  host?: string[]
  path?: string[]
  query?: PostmanQueryParam[]
  variable?: PostmanVariable[]
}

export interface PostmanQueryParam {
  key: string
  value?: string
  description?: string
  disabled?: boolean
}

export interface PostmanHeader {
  key: string
  value: string
  type?: string
  description?: string
  disabled?: boolean
}

export interface PostmanBody {
  mode: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql'
  raw?: string
  urlencoded?: PostmanFormParam[]
  formdata?: PostmanFormParam[]
  options?: {
    raw?: {
      language?: string
    }
  }
}

export interface PostmanFormParam {
  key: string
  value?: string
  type?: string
  description?: string
  disabled?: boolean
  src?: string[]
}

export interface PostmanAuth {
  type: 'apikey' | 'awsv4' | 'basic' | 'bearer' | 'digest' | 'hawk' | 'noauth' | 'oauth1' | 'oauth2' | 'ntlm'
  apikey?: PostmanAuthApiKey[]
  bearer?: PostmanAuthBearer[]
  basic?: PostmanAuthBasic[]
  oauth2?: PostmanAuthOAuth2[]
  [key: string]: any
}

export interface PostmanAuthApiKey {
  key: string
  value: string
  type: string
}

export interface PostmanAuthBearer {
  key: string
  value: string
  type: string
}

export interface PostmanAuthBasic {
  key: string
  value: string
  type: string
}

export interface PostmanAuthOAuth2 {
  key: string
  value: string
  type: string
}

export interface PostmanVariable {
  key: string
  value: string
  type?: string
  description?: string
}

export interface PostmanResponse {
  name: string
  originalRequest: PostmanRequest
  status: string
  code: number
  _postman_previewlanguage?: string
  header?: PostmanHeader[]
  body?: string
}

export interface PostmanEvent {
  listen: string
  script: {
    type?: string
    exec?: string[]
  }
}

/**
 * Convert OpenAPI spec to Postman Collection v2.1
 */
export function convertToPostmanCollection(
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): PostmanCollection {
  const resolver = new RefResolver(spec)
  const collection: PostmanCollection = {
    info: {
      name: spec.info.title || 'API Collection',
      description: spec.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'specula-openapi-exporter',
    },
    item: [],
  }

  // Add collection variables from servers
  if (spec.servers && spec.servers.length > 0) {
    collection.variable = []
    const baseServer = spec.servers[0]
    const url = new URL(baseServer.url)
    
    collection.variable.push({
      key: 'baseUrl',
      value: baseServer.url,
      type: 'string',
    })

    // Add server variables
    if (baseServer.variables) {
      Object.entries(baseServer.variables).forEach(([key, variable]) => {
        collection.variable!.push({
          key,
          value: variable.default,
          type: 'string',
        })
      })
    }
  }

  // Convert auth schemes to Postman auth
  const collectionAuth = convertSecuritySchemesToPostmanAuth(spec, authorizationCredentials)
  if (collectionAuth) {
    collection.auth = collectionAuth
  }

  // Group operations by tags
  const operationsByTag: Map<string, Array<{ path: string; method: string; operation: Operation }>> = new Map()

  Object.entries(spec.paths).forEach(([path, pathItem]) => {
    const methods: Array<'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace'> = [
      'get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'
    ]

    methods.forEach((method) => {
      const operation = pathItem[method]
      if (!operation) return

      const tags = operation.tags || ['Untagged']
      tags.forEach((tag) => {
        if (!operationsByTag.has(tag)) {
          operationsByTag.set(tag, [])
        }
        operationsByTag.get(tag)!.push({
          path,
          method: method.toUpperCase(),
          operation,
        })
      })
    })
  })

  // Convert operations to Postman items
  operationsByTag.forEach((operations, tag) => {
    const tagItems: PostmanItem[] = operations.map(({ path, method, operation }) => {
      return convertOperationToPostmanItem(spec, path, method, operation, resolver, authorizationCredentials)
    })

    // If only one item and it has no nested items, add it directly
    // Otherwise, group them by tag
    if (tagItems.length === 1 && !tagItems[0].item) {
      collection.item.push(tagItems[0])
    } else {
      collection.item.push({
        name: tag,
        description: spec.tags?.find(t => t.name === tag)?.description,
        item: tagItems,
      })
    }
  })

  // Handle webhooks if present (OpenAPI 3.1+)
  if (spec.webhooks) {
    const webhookItems: PostmanItem[] = []
    Object.entries(spec.webhooks).forEach(([name, pathItem]) => {
      const methods: Array<'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace'> = [
        'get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'
      ]

      methods.forEach((method) => {
        const operation = pathItem[method]
        if (!operation) return

        webhookItems.push(convertOperationToPostmanItem(spec, name, method, operation, resolver, authorizationCredentials, true))
      })
    })

    if (webhookItems.length > 0) {
      collection.item.push({
        name: 'Webhooks',
        item: webhookItems,
      })
    }
  }

  return collection
}

/**
 * Convert a single operation to Postman item
 */
function convertOperationToPostmanItem(
  spec: OpenAPISpec,
  path: string,
  method: string,
  operation: Operation,
  resolver: RefResolver,
  authorizationCredentials?: Record<string, string>,
  isWebhook: boolean = false
): PostmanItem {
  const operationId = getOperationId(operation, method, path)
  const operationSecurity = getOperationSecurity(operation, undefined, spec)

  // Build URL
  const serverUrl = spec.servers?.[0]?.url || 'http://localhost'
  const url = buildPostmanUrl(serverUrl, path, operation, resolver)

  // Build headers
  const headers = buildPostmanHeaders(operation, resolver, operationSecurity, spec, authorizationCredentials)

  // Build body
  const body = buildPostmanBody(operation, resolver)

  // Build request auth (operation-specific)
  const requestAuth = buildPostmanRequestAuth(operationSecurity, spec, authorizationCredentials)

  const postmanRequest: PostmanRequest = {
    method: method.toUpperCase(),
    header: headers.length > 0 ? headers : undefined,
    url,
    description: operation.description,
    auth: requestAuth,
  }

  if (body) {
    postmanRequest.body = body
  }

  const itemName = operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`

  return {
    name: itemName,
    request: postmanRequest,
    description: operation.description || operation.summary,
  }
}

/**
 * Build Postman URL from OpenAPI path and parameters
 */
function buildPostmanUrl(
  serverUrl: string,
  path: string,
  operation: Operation,
  resolver: RefResolver
): PostmanUrl {
  const url = new URL(serverUrl)
  const pathParts: string[] = []
  const queryParams: PostmanQueryParam[] = []

  // Process path segments and path parameters
  const pathSegments = path.split('/')
  pathSegments.forEach((segment) => {
    if (segment.startsWith('{') && segment.endsWith('}')) {
      const paramName = segment.slice(1, -1)
      pathParts.push(`:${paramName}`)
    } else if (segment) {
      pathParts.push(segment)
    }
  })

  // Process query parameters
  const parameters = operation.parameters || []
  parameters.forEach((param) => {
    const resolvedParam = resolver.resolve<Parameter>(param)
    if (resolvedParam.in === 'query') {
      queryParams.push({
        key: resolvedParam.name,
        value: resolvedParam.example !== undefined ? String(resolvedParam.example) : '',
        description: resolvedParam.description,
        disabled: !resolvedParam.required,
      })
    }
  })

  // Build raw URL
  let rawUrl = serverUrl
  if (!rawUrl.endsWith('/')) {
    rawUrl += '/'
  }
  rawUrl += path.replace(/\/+/g, '/').replace(/^\//, '')

  if (queryParams.length > 0) {
    const queryString = queryParams
      .filter(p => !p.disabled && p.value)
      .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value || '')}`)
      .join('&')
    if (queryString) {
      rawUrl += '?' + queryString
    }
  }

  return {
    raw: rawUrl,
    protocol: url.protocol.replace(':', ''),
    host: url.host.split('.'),
    path: pathParts,
    query: queryParams.length > 0 ? queryParams : undefined,
  }
}

/**
 * Build Postman headers from OpenAPI operation
 */
function buildPostmanHeaders(
  operation: Operation,
  resolver: RefResolver,
  operationSecurity: Array<Record<string, string[]>> | undefined,
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): PostmanHeader[] {
  const headers: PostmanHeader[] = []

  // Add header parameters
  const parameters = operation.parameters || []
  parameters.forEach((param) => {
    const resolvedParam = resolver.resolve<Parameter>(param)
    if (resolvedParam.in === 'header') {
      headers.push({
        key: resolvedParam.name,
        value: resolvedParam.example !== undefined ? String(resolvedParam.example) : '',
        description: resolvedParam.description,
        disabled: !resolvedParam.required,
      })
    }
  })

  // Content-Type will be set by body, so we don't add it here explicitly
  // unless there's no body

  return headers
}

/**
 * Build Postman body from OpenAPI requestBody
 */
function buildPostmanBody(operation: Operation, resolver: RefResolver): PostmanBody | undefined {
  if (!operation.requestBody) return undefined

  const resolvedBody = resolver.resolve<RequestBody>(operation.requestBody)
  if (!resolvedBody.content) return undefined

  // Prefer JSON
  const jsonContent = resolvedBody.content['application/json']
  if (jsonContent) {
    let exampleValue = ''
    
    if (jsonContent.example) {
      exampleValue = JSON.stringify(jsonContent.example, null, 2)
    } else if (jsonContent.schema) {
      // Try to generate example from schema
      const example = generateExampleFromSchema(jsonContent.schema, resolver)
      if (example) {
        exampleValue = JSON.stringify(example, null, 2)
      }
    }

    return {
      mode: 'raw',
      raw: exampleValue || '{}',
      options: {
        raw: {
          language: 'json',
        },
      },
    }
  }

  // Form data
  const formDataContent = resolvedBody.content['application/x-www-form-urlencoded']
  if (formDataContent) {
    const params: PostmanFormParam[] = []
    if (formDataContent.schema?.properties) {
      Object.entries(formDataContent.schema.properties).forEach(([key, schema]: [string, any]) => {
        params.push({
          key,
          value: schema.example !== undefined ? String(schema.example) : '',
          description: schema.description,
          disabled: !formDataContent.schema.required?.includes(key),
        })
      })
    }
    return {
      mode: 'urlencoded',
      urlencoded: params,
    }
  }

  // Multipart form data
  const multipartContent = resolvedBody.content['multipart/form-data']
  if (multipartContent) {
    const params: PostmanFormParam[] = []
    if (multipartContent.schema?.properties) {
      Object.entries(multipartContent.schema.properties).forEach(([key, schema]: [string, any]) => {
        const isFile = schema.type === 'string' && (schema.format === 'binary' || schema.format === 'base64')
        params.push({
          key,
          value: isFile ? '' : (schema.example !== undefined ? String(schema.example) : ''),
          type: isFile ? 'file' : 'text',
          description: schema.description,
          disabled: !multipartContent.schema.required?.includes(key),
        })
      })
    }
    return {
      mode: 'formdata',
      formdata: params,
    }
  }

  return undefined
}

/**
 * Convert OpenAPI security schemes to Postman auth
 */
function convertSecuritySchemesToPostmanAuth(
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): PostmanAuth | undefined {
  if (!spec.components?.securitySchemes || !spec.security) {
    return undefined
  }

  // Use the first security requirement
  const firstSecurity = spec.security[0]
  const schemeName = Object.keys(firstSecurity)[0]
  const securityScheme = spec.components.securitySchemes[schemeName]

  if (!securityScheme) return undefined

  return buildPostmanAuth(securityScheme, schemeName, authorizationCredentials?.[schemeName])
}

/**
 * Build Postman request auth for operation
 */
function buildPostmanRequestAuth(
  operationSecurity: Array<Record<string, string[]>> | undefined,
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): PostmanAuth | undefined {
  if (!operationSecurity || operationSecurity.length === 0) {
    return undefined
  }

  const firstSecurity = operationSecurity[0]
  const schemeName = Object.keys(firstSecurity)[0]
  const securityScheme = spec.components?.securitySchemes?.[schemeName]

  if (!securityScheme) return undefined

  return buildPostmanAuth(securityScheme, schemeName, authorizationCredentials?.[schemeName])
}

/**
 * Build Postman auth from security scheme
 */
function buildPostmanAuth(
  securityScheme: SecurityScheme,
  schemeName: string,
  credential?: string
): PostmanAuth | undefined {
  switch (securityScheme.type) {
    case 'apiKey': {
      if (securityScheme.in === 'query') {
        // Query params are handled in URL, so we don't set auth here
        return undefined
      }
      
      return {
        type: 'apikey',
        apikey: [
          { key: 'key', value: securityScheme.name || schemeName, type: 'string' },
          { key: 'value', value: credential || '', type: 'string' },
          { key: 'in', value: securityScheme.in === 'header' ? 'header' : 'query', type: 'string' },
        ],
      }
    }

    case 'http': {
      const scheme = securityScheme.scheme?.toLowerCase() || 'bearer'
      
      if (scheme === 'bearer') {
        return {
          type: 'bearer',
          bearer: [
            { key: 'token', value: credential || '', type: 'string' },
          ],
        }
      }
      
      if (scheme === 'basic') {
        // Basic auth requires username:password format
        // We'll just set the credential as-is, user can format it properly in Postman
        return {
          type: 'basic',
          basic: [
            { key: 'username', value: credential ? credential.split(':')[0] : '', type: 'string' },
            { key: 'password', value: credential ? credential.split(':')[1] || '' : '', type: 'string' },
          ],
        }
      }
      
      return undefined
    }

    case 'oauth2': {
      return {
        type: 'oauth2',
        oauth2: [
          { key: 'accessToken', value: credential || '', type: 'string' },
        ],
      }
    }

    case 'openIdConnect': {
      return {
        type: 'oauth2',
        oauth2: [
          { key: 'accessToken', value: credential || '', type: 'string' },
        ],
      }
    }

    default:
      return undefined
  }
}

/**
 * Generate example value from schema
 */
function generateExampleFromSchema(schema: any, resolver: RefResolver): any {
  const resolved = resolver.resolve(schema)
  
  if (resolved.example !== undefined) {
    return resolved.example
  }
  
  if (resolved.default !== undefined) {
    return resolved.default
  }

  switch (resolved.type) {
    case 'string':
      return ''
    case 'number':
    case 'integer':
      return 0
    case 'boolean':
      return false
    case 'array':
      return []
    case 'object':
      const obj: any = {}
      if (resolved.properties) {
        Object.keys(resolved.properties).forEach((key) => {
          const propSchema = resolved.properties[key]
          obj[key] = generateExampleFromSchema(propSchema, resolver)
        })
      }
      return obj
    default:
      return null
  }
}

