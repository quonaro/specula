import type { SpecWithSource } from '@/stores/spec'
import { isOperationPrivate } from './openapi-parser'

// Cache for operation privacy checks
// Key: `${method}:${path}`, Value: boolean
const privacyCache = new Map<string, boolean>()

// Cache for spec lookups by path
// Key: path, Value: { specWithSource, pathItem }
const pathItemCache = new Map<string, { specWithSource: SpecWithSource; pathItem: any } | null>()

/**
 * Get method color class for Tailwind CSS
 * This is a pure function that can be reused across components
 */
export function getMethodColorClass(method: string): string {
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

/**
 * Check if an operation is private (requires authentication)
 * Uses caching to avoid repeated lookups
 */
export function checkOperationPrivacy(
  op: { method: string; path: string },
  specs: SpecWithSource[]
): boolean {
  const cacheKey = `${op.method}:${op.path}`
  
  // Check cache first
  if (privacyCache.has(cacheKey)) {
    return privacyCache.get(cacheKey)!
  }

  // Find the spec that contains this operation
  let result = false
  
  // Try to use cached pathItem first
  const cachedPathItem = pathItemCache.get(op.path)
  if (cachedPathItem) {
    const { specWithSource, pathItem } = cachedPathItem
    const operation = pathItem[op.method.toLowerCase() as keyof typeof pathItem]
    if (operation) {
      result = isOperationPrivate(operation, pathItem, specWithSource.spec)
    }
  } else {
    // Search through specs
    for (const specWithSource of specs) {
      const pathItem = specWithSource.spec.paths[op.path]
      if (pathItem) {
        // Cache the pathItem for future use
        pathItemCache.set(op.path, { specWithSource, pathItem })
        
        const operation = pathItem[op.method.toLowerCase() as keyof typeof pathItem]
        if (operation) {
          result = isOperationPrivate(operation, pathItem, specWithSource.spec)
          break
        }
      }
    }
    
    // Cache null if not found
    if (!pathItemCache.has(op.path)) {
      pathItemCache.set(op.path, null)
    }
  }

  // Cache the result
  privacyCache.set(cacheKey, result)
  return result
}

/**
 * Clear all caches
 * Should be called when specs are updated
 */
export function clearOperationCaches(): void {
  privacyCache.clear()
  pathItemCache.clear()
}

/**
 * Invalidate cache for a specific operation
 */
export function invalidateOperationCache(method: string, path: string): void {
  const cacheKey = `${method}:${path}`
  privacyCache.delete(cacheKey)
  pathItemCache.delete(path)
}

