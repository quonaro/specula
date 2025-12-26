import type { OpenAPISpec, Operation, Parameter, RequestBody, SecurityScheme } from '@/types/openapi'
import { RefResolver } from './ref-resolver'
import { getOperationSecurity, getOperationId } from './openapi-parser'

export interface InsomniaCollection {
  _type: 'export'
  __export_format: number
  __export_date: string
  __export_source: string
  resources: InsomniaResource[]
}

export interface InsomniaResource {
  _id: string
  _type: 'request' | 'request_group' | 'environment' | 'cookie_jar' | 'workspace'
  _parentId?: string | null
  modified: number
  created: number
  name: string
  description?: string
  url?: string
  method?: string
  body?: InsomniaBody
  parameters?: InsomniaParameter[]
  headers?: InsomniaHeader[]
  authentication?: InsomniaAuth
  settingStoreCookies?: boolean
  settingSendCookies?: boolean
  settingDisableRenderRequestBody?: boolean
  settingEncodeUrl?: boolean
  settingRebuildPath?: boolean
  settingFollowRedirects?: 'global' | 'on' | 'off'
}

export interface InsomniaBody {
  mimeType?: string
  text?: string
  params?: InsomniaFormParam[]
  fileName?: string
}

export interface InsomniaParameter {
  name: string
  value?: string
  description?: string
  disabled?: boolean
  id?: string
}

export interface InsomniaFormParam {
  name: string
  value?: string
  description?: string
  disabled?: boolean
  id?: string
  fileName?: string
  type?: string
}

export interface InsomniaHeader {
  name: string
  value: string
  description?: string
  disabled?: boolean
  id?: string
}

export interface InsomniaAuth {
  type: 'basic' | 'digest' | 'bearer' | 'oauth2' | 'oauth1' | 'ntlm' | 'apikey' | 'hawk' | 'aws' | 'asap'
  disabled?: boolean
  username?: string
  password?: string
  token?: string
  prefix?: string
  [key: string]: any
}

/**
 * Convert OpenAPI spec to Insomnia Collection (v4 format)
 */
export function convertToInsomniaCollection(
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): InsomniaCollection {
  const resources: InsomniaResource[] = []
  const resolver = new RefResolver(spec)
  const timestamp = Date.now()

  // Create workspace
  const workspaceId = generateId()
  resources.push({
    _id: workspaceId,
    _type: 'workspace',
    _parentId: null,
    modified: timestamp,
    created: timestamp,
    name: spec.info.title || 'API Collection',
    description: spec.info.description,
  })

  // Create environment if we have servers with variables
  if (spec.servers && spec.servers.length > 0) {
    const envId = generateId()
    const baseServer = spec.servers[0]
    const envData: Record<string, string> = {}

    // Add base URL as a variable (Insomnia uses underscore prefix for special variables)
    envData['base_url'] = baseServer.url

    if (baseServer.variables) {
      Object.entries(baseServer.variables).forEach(([key, variable]) => {
        envData[key] = variable.default
      })
    }

    resources.push({
      _id: envId,
      _type: 'environment',
      _parentId: workspaceId,
      modified: timestamp,
      created: timestamp,
      name: 'Base Environment',
      data: envData,
      color: null,
      isPrivate: false,
      metaSortKey: timestamp,
    } as any)
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

  // Convert operations to Insomnia resources
  operationsByTag.forEach((operations, tag) => {
    // Create request group for tag
    const groupId = generateId()
    resources.push({
      _id: groupId,
      _type: 'request_group',
      _parentId: workspaceId,
      modified: timestamp,
      created: timestamp,
      name: tag,
      description: spec.tags?.find(t => t.name === tag)?.description,
    })

    // Add requests to the group
    operations.forEach(({ path, method, operation }) => {
      const request = convertOperationToInsomniaRequest(
        spec,
        path,
        method,
        operation,
        resolver,
        groupId,
        timestamp,
        authorizationCredentials
      )
      resources.push(request)
    })
  })

  // Handle webhooks if present (OpenAPI 3.1+)
  if (spec.webhooks) {
    const webhookGroupId = generateId()
    resources.push({
      _id: webhookGroupId,
      _type: 'request_group',
      _parentId: workspaceId,
      modified: timestamp,
      created: timestamp,
      name: 'Webhooks',
    })

    Object.entries(spec.webhooks).forEach(([name, pathItem]) => {
      const methods: Array<'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'trace'> = [
        'get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'
      ]

      methods.forEach((method) => {
        const operation = pathItem[method]
        if (!operation) return

        const request = convertOperationToInsomniaRequest(
          spec,
          name,
          method,
          operation,
          resolver,
          webhookGroupId,
          timestamp,
          authorizationCredentials,
          true
        )
        resources.push(request)
      })
    })
  }

  return {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'specula-openapi-exporter',
    resources,
  }
}

/**
 * Convert a single operation to Insomnia request
 */
function convertOperationToInsomniaRequest(
  spec: OpenAPISpec,
  path: string,
  method: string,
  operation: Operation,
  resolver: RefResolver,
  parentId: string,
  timestamp: number,
  authorizationCredentials?: Record<string, string>,
  isWebhook: boolean = false
): InsomniaResource {
  const operationId = getOperationId(operation, method, path)
  const operationSecurity = getOperationSecurity(operation, undefined, spec)

  // Build URL
  const serverUrl = spec.servers?.[0]?.url || 'http://localhost'
  const url = buildInsomniaUrl(serverUrl, path)

  // Build headers
  const headers = buildInsomniaHeaders(operation, resolver, operationSecurity, spec, authorizationCredentials)

  // Build parameters (query, path, etc.)
  const parameters = buildInsomniaParameters(operation, resolver)

  // Build body
  const body = buildInsomniaBody(operation, resolver)

  // Build auth
  const auth = buildInsomniaAuth(operationSecurity, spec, authorizationCredentials)

  const request: InsomniaResource = {
    _id: generateId(),
    _type: 'request',
    _parentId: parentId,
    modified: timestamp,
    created: timestamp,
    name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
    description: operation.description || operation.summary,
    url,
    method: method.toUpperCase(),
    headers: headers.length > 0 ? headers : undefined,
    parameters: parameters.length > 0 ? parameters : undefined,
    body,
    authentication: auth,
    settingStoreCookies: true,
    settingSendCookies: true,
    settingDisableRenderRequestBody: false,
    settingEncodeUrl: true,
    settingRebuildPath: true,
    settingFollowRedirects: 'global',
  }

  return request
}

/**
 * Build Insomnia URL from OpenAPI path
 */
function buildInsomniaUrl(serverUrl: string, path: string): string {
  // Replace {param} with {{$param}} for Insomnia path variables
  let urlPath = path.replace(/\{([^}]+)\}/g, '{{$1}}')
  
  // Combine base URL and path
  const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl
  const cleanPath = urlPath.startsWith('/') ? urlPath : '/' + urlPath
  
  // Return full URL - Insomnia will handle variables
  return baseUrl + cleanPath
}

/**
 * Build Insomnia headers from OpenAPI operation
 */
function buildInsomniaHeaders(
  operation: Operation,
  resolver: RefResolver,
  operationSecurity: Array<Record<string, string[]>> | undefined,
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): InsomniaHeader[] {
  const headers: InsomniaHeader[] = []

  // Add header parameters
  const parameters = operation.parameters || []
  parameters.forEach((param) => {
    const resolvedParam = resolver.resolve<Parameter>(param)
    if (resolvedParam.in === 'header') {
      headers.push({
        name: resolvedParam.name,
        value: resolvedParam.example !== undefined ? String(resolvedParam.example) : '',
        description: resolvedParam.description,
        disabled: !resolvedParam.required,
        id: generateId(),
      })
    }
  })

  return headers
}

/**
 * Build Insomnia parameters (query params)
 */
function buildInsomniaParameters(operation: Operation, resolver: RefResolver): InsomniaParameter[] {
  const parameters: InsomniaParameter[] = []

  const opParams = operation.parameters || []
  opParams.forEach((param) => {
    const resolvedParam = resolver.resolve<Parameter>(param)
    if (resolvedParam.in === 'query') {
      parameters.push({
        name: resolvedParam.name,
        value: resolvedParam.example !== undefined ? String(resolvedParam.example) : '',
        description: resolvedParam.description,
        disabled: !resolvedParam.required,
        id: generateId(),
      })
    }
  })

  return parameters
}

/**
 * Build Insomnia body from OpenAPI requestBody
 */
function buildInsomniaBody(operation: Operation, resolver: RefResolver): InsomniaBody | undefined {
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
      const example = generateExampleFromSchema(jsonContent.schema, resolver)
      if (example) {
        exampleValue = JSON.stringify(example, null, 2)
      }
    }

    return {
      mimeType: 'application/json',
      text: exampleValue || '{}',
    }
  }

  // Form data
  const formDataContent = resolvedBody.content['application/x-www-form-urlencoded']
  if (formDataContent) {
    const params: InsomniaFormParam[] = []
    if (formDataContent.schema?.properties) {
      Object.entries(formDataContent.schema.properties).forEach(([key, schema]: [string, any]) => {
        params.push({
          name: key,
          value: schema.example !== undefined ? String(schema.example) : '',
          description: schema.description,
          disabled: !formDataContent.schema.required?.includes(key),
          id: generateId(),
        })
      })
    }
    return {
      mimeType: 'application/x-www-form-urlencoded',
      params,
    }
  }

  // Multipart form data
  const multipartContent = resolvedBody.content['multipart/form-data']
  if (multipartContent) {
    const params: InsomniaFormParam[] = []
    if (multipartContent.schema?.properties) {
      Object.entries(multipartContent.schema.properties).forEach(([key, schema]: [string, any]) => {
        const isFile = schema.type === 'string' && (schema.format === 'binary' || schema.format === 'base64')
        params.push({
          name: key,
          value: isFile ? '' : (schema.example !== undefined ? String(schema.example) : ''),
          description: schema.description,
          disabled: !multipartContent.schema.required?.includes(key),
          id: generateId(),
          type: isFile ? 'file' : 'text',
        })
      })
    }
    return {
      mimeType: 'multipart/form-data',
      params,
    }
  }

  return undefined
}

/**
 * Build Insomnia auth from security schemes
 */
function buildInsomniaAuth(
  operationSecurity: Array<Record<string, string[]>> | undefined,
  spec: OpenAPISpec,
  authorizationCredentials?: Record<string, string>
): InsomniaAuth | undefined {
  if (!operationSecurity || operationSecurity.length === 0) {
    return undefined
  }

  const firstSecurity = operationSecurity[0]
  const schemeName = Object.keys(firstSecurity)[0]
  const securityScheme = spec.components?.securitySchemes?.[schemeName]

  if (!securityScheme) return undefined

  return buildInsomniaAuthFromScheme(securityScheme, schemeName, authorizationCredentials?.[schemeName])
}

/**
 * Build Insomnia auth from security scheme
 */
function buildInsomniaAuthFromScheme(
  securityScheme: SecurityScheme,
  schemeName: string,
  credential?: string
): InsomniaAuth | undefined {
  switch (securityScheme.type) {
    case 'apiKey': {
      if (securityScheme.in === 'header') {
        return {
          type: 'apikey',
          key: securityScheme.name || schemeName,
          value: credential || '',
          addTo: securityScheme.in === 'header' ? 'header' : 'query',
        }
      }
      // Query params are handled in parameters
      return undefined
    }

    case 'http': {
      const scheme = securityScheme.scheme?.toLowerCase() || 'bearer'
      
      if (scheme === 'bearer') {
        return {
          type: 'bearer',
          token: credential || '',
          prefix: securityScheme.bearerFormat || 'Bearer',
        }
      }
      
      if (scheme === 'basic') {
        const parts = credential ? credential.split(':') : []
        return {
          type: 'basic',
          username: parts[0] || '',
          password: parts[1] || '',
        }
      }

      if (scheme === 'digest') {
        return {
          type: 'digest',
          username: credential ? credential.split(':')[0] : '',
          password: credential ? credential.split(':')[1] || '' : '',
        }
      }
      
      return undefined
    }

    case 'oauth2': {
      return {
        type: 'oauth2',
        grantType: 'authorization_code',
        accessToken: credential || '',
      }
    }

    case 'openIdConnect': {
      return {
        type: 'oauth2',
        grantType: 'authorization_code',
        accessToken: credential || '',
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

/**
 * Generate unique ID for Insomnia resources
 */
function generateId(): string {
  return 'req_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

