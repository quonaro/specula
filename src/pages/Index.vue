<template>
  <div v-if="specStore.specs.length === 0 || !tagTree" class="h-screen flex items-center justify-center">
    <div class="text-center space-y-4">
      <p class="text-lg text-muted-foreground">No specification loaded</p>
      <Button @click="router.push('/selection')">
        Go to Selection
      </Button>
    </div>
  </div>
  
  <div v-else class="flex h-screen w-full bg-background">
    <Sidebar
      :root="tagTree"
      :selected-operation="selectedOperation"
      @operation-select="handleOperationSelect"
      @group-select="handleGroupSelect"
    />
    
    <div class="flex-1 flex flex-col h-screen">
      <header class="border-b border-border bg-card">
        <div class="h-14 flex items-center justify-between px-6">
          <div class="flex items-center gap-3">
            <div>
              <h1 class="text-lg font-semibold text-foreground">
                {{ specStore.specs.length === 1 
                  ? (specStore.specs[0].spec?.info?.title || 'OpenAPI Specification')
                  : `${specStore.specs.length} Specifications` }}
              </h1>
              <p class="text-xs text-muted-foreground">
                {{ specStore.specs.length === 1
                  ? `v${specStore.specs[0].spec?.info?.version || '1.0.0'} | OpenAPI ${specStore.specs[0].spec?.openapi}`
                  : 'Multiple specifications loaded' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              @click="handleBackToSelection"
            >
              <ArrowLeft class="h-4 w-4 mr-2" />
              Back to Selection
            </Button>
            <Button variant="outline" size="sm" @click="showDownloadDialog = true">
              <Download class="h-4 w-4 mr-2" />
              Download
            </Button>
            <ThemeToggle />
          </div>
        </div>
        
        <!-- Global info banner -->
        <div
          v-if="specStore.specs.length === 1 && specStore.specs[0].spec && (specStore.specs[0].spec.info.description || (specStore.specs[0].spec.servers && specStore.specs[0].spec.servers.length > 0) || specStore.specs[0].spec.externalDocs)"
          class="px-6 py-3 bg-muted/30 border-t border-border text-sm space-y-2"
        >
          <p v-if="specStore.specs[0].spec.info.description" class="text-muted-foreground">
            {{ specStore.specs[0].spec.info.description }}
          </p>
          <div v-if="specStore.specs[0].spec.servers && specStore.specs[0].spec.servers.length > 0" class="flex items-center gap-2 flex-wrap">
            <span class="font-medium">Servers:</span>
            <code
              v-for="(server, idx) in specStore.specs[0].spec.servers"
              :key="idx"
              class="px-2 py-0.5 bg-code-bg rounded text-xs"
            >
              {{ server.url }}
            </code>
          </div>
          <a
            v-if="specStore.specs[0].spec.externalDocs"
            :href="specStore.specs[0].spec.externalDocs.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline inline-flex items-center gap-1"
          >
            📖 {{ specStore.specs[0].spec.externalDocs.description || 'External Documentation' }}
          </a>
        </div>
      </header>

      <main class="flex-1 overflow-hidden">
        <GroupEndpointsView
          v-if="selectedGroup"
          :group-node="selectedGroup"
          :selected-operation="selectedOperation"
          @select-operation="handleOperationSelect"
        />
        <OperationView
          v-else-if="operationDetails"
          :method="operationDetails.method"
          :path="operationDetails.path"
          :operation="operationDetails.operation"
          :spec="operationDetails.spec"
          :source-url="operationDetails.sourceUrl"
        />
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center space-y-2">
            <img src="/logo.png" alt="Logo" class="mx-auto h-16 w-16 logo-image-opacity" />
            <p class="text-lg font-medium text-foreground">
              Select an operation
            </p>
            <p class="text-sm text-muted-foreground">
              Choose an endpoint from the sidebar to view details
            </p>
          </div>
        </div>
      </main>
    </div>
    
    <!-- Download Dialog -->
    <DownloadDialog
      v-model="showDownloadDialog"
      :specs="specStore.specs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, ArrowLeft } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import OperationView from '@/components/OperationView.vue'
import GroupEndpointsView from '@/components/GroupEndpointsView.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import DownloadDialog from '@/components/DownloadDialog.vue'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'
import { useSpecStore } from '@/stores/spec'
import { useSpecCacheStore, isHash } from '@/stores/specCache'
import { useSpecHistoryStore } from '@/stores/specHistory'
import { useLastWorkspaceStore } from '@/stores/lastWorkspace'
import type { OpenAPISpec, TagNode, Operation } from '@/types/openapi'
import { parseOpenAPISpec, parseMultipleSpecs, findNodeByPath, findNodeBySlug, toSlug, endpointPathToSlug, slugToEndpointPath } from '@/utils/openapi-parser'
import { clearOperationCaches } from '@/utils/operation-cache'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const specStore = useSpecStore()
const specCacheStore = useSpecCacheStore()
const specHistoryStore = useSpecHistoryStore()
const lastWorkspaceStore = useLastWorkspaceStore()
const tagTree = ref<TagNode | null>(null)
const selectedOperation = ref<{ method: string; path: string } | null>(null)
const selectedGroup = ref<TagNode | null>(null)
const showDownloadDialog = ref(false)

// Get specId from query parameters (returns last spec parameter if available)
const getSpecIdFromQuery = (): string | null => {
  const specParams = route.query.spec
  if (!specParams) return null
  
  if (Array.isArray(specParams)) {
    // Return the last one (as in the example: d407de6a4b3cc4f8)
    return specParams.length > 0 ? specParams[specParams.length - 1] as string : null
  } else {
    // Single value or comma-separated
    const values = specParams.split(',').map(v => v.trim())
    return values.length > 0 ? values[values.length - 1] : null
  }
}

// Find hash for a specific spec by comparing the spec object
// Optimized: prefer reference equality over JSON.stringify
const findSpecHash = (targetSpec: OpenAPISpec): string | null => {
  // First, try to find in current specs by reference comparison (fastest)
  for (const specWithSource of specStore.specs) {
    if (specWithSource.spec === targetSpec) {
      // If it has sourceUrl, try to find hash from query params
      if (specWithSource.sourceUrl) {
        const specParams = route.query.spec
        if (specParams) {
          const params = Array.isArray(specParams) ? specParams : [specParams]
          // Find the index of this spec in the array
          const specIndex = specStore.specs.findIndex(s => s === specWithSource)
          if (specIndex >= 0 && specIndex < params.length) {
            const param = params[specIndex]
            if (isHash(param)) {
              return param
            }
          }
        }
      }
      
      // Try to find in cache by reference
      const cachedSpecs = Array.from(specCacheStore.cache.values())
      const cached = cachedSpecs.find(c => c.spec === targetSpec)
      if (cached) {
        return cached.hash
      }
    }
  }
  
  // Fallback: search in cache by reference (still faster than JSON.stringify)
  const cachedSpecs = Array.from(specCacheStore.cache.values())
  const cached = cachedSpecs.find(c => c.spec === targetSpec)
  if (cached) {
    return cached.hash
  }
  
  // Last resort: use JSON.stringify only if reference comparison failed
  // This should rarely happen if specs are properly managed
  const cachedByContent = cachedSpecs.find(c => {
    // Quick check: compare basic properties first
    if (c.spec.info?.title !== targetSpec.info?.title ||
        c.spec.info?.version !== targetSpec.info?.version ||
        c.spec.openapi !== targetSpec.openapi) {
      return false
    }
    // Only then do expensive JSON comparison
    return JSON.stringify(c.spec) === JSON.stringify(targetSpec)
  })
  return cachedByContent ? cachedByContent.hash : null
}

// Restore state from route
const restoreStateFromRoute = () => {
  if (!tagTree.value) return
  
  const path = route.path
  
  if (path.startsWith('/group/')) {
    const groupSlug = route.params.groupPath as string
    const node = findNodeBySlug(tagTree.value, groupSlug)
    if (node) {
      selectedGroup.value = node
      selectedOperation.value = null
    } else {
      // Group not found, redirect to home
      router.replace('/')
    }
  } else if (path.startsWith('/spec/') && path.includes('/endpoint/')) {
    // New format: /spec/{specId}/endpoint/{method}/{path}
    const specId = route.params.specId as string
    const method = (route.params.method as string).toUpperCase()
    const endpointSlug = route.params.path as string
    
    // Convert slug back to endpoint path
    const endpointPath = slugToEndpointPath(endpointSlug)
    
    // Verify endpoint exists in any spec
    let foundPath: string | null = null
    let foundSpec: OpenAPISpec | null = null
    
    for (const specWithSource of specStore.specs) {
      if (specWithSource.spec.paths[endpointPath]) {
        const pathItem = specWithSource.spec.paths[endpointPath]
        const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
        if (operation) {
          foundPath = endpointPath
          foundSpec = specWithSource.spec
          break
        }
      }
    }
    
    if (foundPath && foundSpec) {
      selectedOperation.value = { method, path: foundPath }
      selectedGroup.value = null
    } else {
      // Try to find by matching slug pattern
      // Search through all paths in all specs to find matching endpoint
      for (const specWithSource of specStore.specs) {
        for (const [path, pathItem] of Object.entries(specWithSource.spec.paths)) {
          const pathSlug = endpointPathToSlug(path)
          if (pathSlug === endpointSlug) {
            const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
            if (op) {
              foundPath = path
              foundSpec = specWithSource.spec
              break
            }
          }
        }
        if (foundPath) break
      }
      
      if (foundPath && foundSpec) {
        selectedOperation.value = { method, path: foundPath }
        selectedGroup.value = null
      } else {
        // Endpoint not found, redirect to home
        router.replace('/')
      }
    }
  } else if (path.startsWith('/endpoint/')) {
    // Old format - redirect to new format if specId is available
    const method = (route.params.method as string).toUpperCase()
    const endpointSlug = route.params.path as string
    const endpointPath = slugToEndpointPath(endpointSlug)
    
    // Find the spec that contains this operation
    let foundSpec: OpenAPISpec | null = null
    for (const specWithSource of specStore.specs) {
      if (specWithSource.spec.paths[endpointPath]) {
        const pathItem = specWithSource.spec.paths[endpointPath]
        const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
        if (operation) {
          foundSpec = specWithSource.spec
          break
        }
      }
    }
    
    // Get specId from the found spec or fallback to query
    const specId = foundSpec ? findSpecHash(foundSpec) : getSpecIdFromQuery()
    if (specId) {
      const query: Record<string, string | string[]> = { ...route.query }
      router.replace({ path: `/spec/${specId}/endpoint/${method.toLowerCase()}/${endpointSlug}`, query })
      return
    }
    
    // Continue with old format if no specId
    
    // Verify endpoint exists in any spec
    let foundPath: string | null = null
    // foundSpec already declared above, reuse it
    foundSpec = null
    
    for (const specWithSource of specStore.specs) {
      if (specWithSource.spec.paths[endpointPath]) {
        const pathItem = specWithSource.spec.paths[endpointPath]
        const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
        if (operation) {
          foundPath = endpointPath
          foundSpec = specWithSource.spec
          break
        }
      }
    }
    
    if (foundPath && foundSpec) {
      selectedOperation.value = { method, path: foundPath }
      selectedGroup.value = null
    } else {
      // Try to find by matching slug pattern
      // Search through all paths in all specs to find matching endpoint
      for (const specWithSource of specStore.specs) {
        for (const [path, pathItem] of Object.entries(specWithSource.spec.paths)) {
          const pathSlug = endpointPathToSlug(path)
          if (pathSlug === endpointSlug) {
            const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
            if (op) {
              foundPath = path
              foundSpec = specWithSource.spec
              break
            }
          }
        }
        if (foundPath) break
      }
      
      if (foundPath && foundSpec) {
        selectedOperation.value = { method, path: foundPath }
        selectedGroup.value = null
      } else {
        // Endpoint not found, redirect to home
        router.replace('/')
      }
    }
  } else if (path === '/') {
    selectedOperation.value = null
    selectedGroup.value = null
  } else {
    // Handle custom paths like /example.com/user/get/users
    // Format: /path/to/endpoint/method where method is HTTP method (GET, POST, etc.)
    const pathWithoutLeadingSlash = path.startsWith('/') ? path.slice(1) : path
    const pathSegments = pathWithoutLeadingSlash.split('/').filter(s => s.length > 0)
    
    // Check if it looks like an endpoint path (has at least method and path)
    if (pathSegments.length >= 2) {
      // Last segment is HTTP method, rest is endpoint path
      const method = pathSegments[pathSegments.length - 1]?.toUpperCase()
      const endpointPathFromUrl = '/' + pathSegments.slice(0, -1).join('/')
      
      // Valid HTTP methods
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE']
      
      if (method && validMethods.includes(method)) {
        let foundPath: string | null = null
        let foundSpec: OpenAPISpec | null = null
        
        // First, try exact path match
        for (const specWithSource of specStore.specs) {
          if (specWithSource.spec.paths[endpointPathFromUrl]) {
            const pathItem = specWithSource.spec.paths[endpointPathFromUrl]
            const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
            if (operation) {
              foundPath = endpointPathFromUrl
              foundSpec = specWithSource.spec
              break
            }
          }
        }
        
        // If not found, try to match by path segments (handling path parameters)
        if (!foundPath) {
          for (const specWithSource of specStore.specs) {
            for (const [endpointPath, pathItem] of Object.entries(specWithSource.spec.paths)) {
              const endpointSegments = endpointPath.split('/').filter(s => s.length > 0)
              const urlSegments = pathSegments.slice(0, -1) // Exclude method
              
              // Try to match path segments
              if (endpointSegments.length === urlSegments.length) {
                let matches = true
                for (let i = 0; i < endpointSegments.length; i++) {
                  const endpointSeg = endpointSegments[i]
                  const urlSeg = urlSegments[i]
                  // Allow match if endpoint segment is a parameter {param} or :param, or if segments match exactly
                  if (!endpointSeg.match(/^[{:]/) && endpointSeg !== urlSeg) {
                    matches = false
                    break
                  }
                }
                
                if (matches) {
                  const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
                  if (operation) {
                    foundPath = endpointPath
                    foundSpec = specWithSource.spec
                    break
                  }
                }
              }
            }
            if (foundPath) break
          }
        }
        
        if (foundPath && foundSpec) {
          selectedOperation.value = { method, path: foundPath }
          selectedGroup.value = null
          // Update URL to use proper format with slug, preserving query params
          const slug = endpointPathToSlug(foundPath)
          const methodLower = method.toLowerCase()
          const query: Record<string, string | string[]> = { ...route.query }
          // Find the spec that contains this operation to get the correct specId
          const specId = findSpecHash(foundSpec) || getSpecIdFromQuery()
          if (specId) {
            router.replace({ path: `/spec/${specId}/endpoint/${methodLower}/${slug}`, query })
          } else {
            router.replace({ path: `/endpoint/${methodLower}/${slug}`, query })
          }
        } else {
          // Path not found, show empty state
          selectedOperation.value = null
          selectedGroup.value = null
        }
      } else {
        // Not a valid HTTP method, show empty state
        selectedOperation.value = null
        selectedGroup.value = null
      }
    } else {
      // Path doesn't match expected format, show empty state
      selectedOperation.value = null
      selectedGroup.value = null
    }
  }
}

// Update URL when specs change (but not when loading from URL to avoid loop)
let isLoadingFromUrl = false

// Update URL with current specs
const updateUrlWithSpecs = (specs: typeof specStore.specs) => {
  const query: Record<string, string | string[]> = { ...route.query }
  
  // Build spec parameters array
  const specParams: string[] = []
  const cachedSpecs = Array.from(specCacheStore.cache.values())
  
  for (const specWithSource of specs) {
    if (specWithSource.sourceUrl) {
      // Use sourceUrl if available
      specParams.push(specWithSource.sourceUrl)
    } else {
      // Try to find hash in cache by reference first (faster)
      let cached = cachedSpecs.find(c => c.spec === specWithSource.spec)
      
      // Fallback to content comparison only if reference doesn't match
      if (!cached) {
        cached = cachedSpecs.find(c => {
          // Quick check first
          if (c.spec.info?.title !== specWithSource.spec.info?.title ||
              c.spec.info?.version !== specWithSource.spec.info?.version ||
              c.spec.openapi !== specWithSource.spec.openapi) {
            return false
          }
          return JSON.stringify(c.spec) === JSON.stringify(specWithSource.spec)
        })
      }
      
      if (cached) {
        specParams.push(cached.hash)
      }
    }
  }
  
  if (specParams.length > 0) {
    query.spec = specParams.length === 1 ? specParams[0] : specParams
  } else {
    delete query.spec
  }
  
  // Update URL without triggering navigation
  router.replace({ path: route.path, query })
}

// Load specs from URL parameter
const loadSpecsFromUrl = async () => {
  // Get all spec parameters (can be array from ?spec=...&spec=... or single value)
  const specParams = route.query.spec
  if (!specParams) {
    // If no spec parameter, check if we have specs in store
    if (specStore.specs.length === 0 && route.path !== '/selection') {
      router.push('/selection')
    }
    return
  }

  isLoadingFromUrl = true

  // Handle both single value and array of values
  let specValues: string[] = []
  if (Array.isArray(specParams)) {
    specValues = specParams.map(val => decodeURIComponent(val as string).trim())
  } else {
    // Also handle comma-separated values
    specValues = specParams.split(',').map(val => decodeURIComponent(val.trim()))
  }

  if (specValues.length === 0) return

  try {
    const loadedSpecs = []
    for (const value of specValues) {
      try {
        let spec: OpenAPISpec
        let sourceUrl: string | undefined
        let title: string

        // Check if value is a hash (16 hex characters) or a URL
        if (isHash(value)) {
          // Load from cache
          const cachedSpec = specCacheStore.getByHash(value)
          if (!cachedSpec) {
            toast({
              title: 'Cache miss',
              description: `Specification with hash ${value} not found in cache`,
              variant: 'destructive',
            })
            continue
          }
          spec = cachedSpec
          const cached = specCacheStore.getCachedSpec(value)
          title = cached?.title || spec.info?.title || 'Untitled Specification'
        } else {
          // Load from URL
          const response = await fetch(value)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          spec = await response.json()
          sourceUrl = value
          title = spec.info?.title || 'Untitled Specification'
        }

        loadedSpecs.push({
          spec,
          sourceUrl,
          title,
        })
      } catch (error: any) {
        toast({
          title: 'Failed to load spec',
          description: `Could not load specification from ${value}: ${error.message}`,
          variant: 'destructive',
        })
      }
    }

    if (loadedSpecs.length > 0) {
      specStore.setSpecs(loadedSpecs)
    }
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to load specifications',
      variant: 'destructive',
    })
  } finally {
    isLoadingFromUrl = false
  }
}

watch(() => specStore.specs, (newSpecs, oldSpecs) => {
  // Clear operation caches when specs change
  if (oldSpecs && oldSpecs.length > 0 && newSpecs.length > 0) {
    // Check if specs actually changed (not just reference)
    const specsChanged = newSpecs.length !== oldSpecs.length ||
      newSpecs.some((newSpec, index) => {
        const oldSpec = oldSpecs[index]
        return !oldSpec || newSpec.spec !== oldSpec.spec
      })
    
    if (specsChanged) {
      clearOperationCaches()
    }
  } else if (newSpecs.length === 0 && oldSpecs && oldSpecs.length > 0) {
    // Clear cache when all specs are removed
    clearOperationCaches()
  }
  
  if (newSpecs.length > 0) {
    if (newSpecs.length === 1) {
      // Single spec - use regular parsing
      tagTree.value = parseOpenAPISpec(newSpecs[0].spec)
    } else {
      // Multiple specs - use multi-spec parsing
      tagTree.value = parseMultipleSpecs(newSpecs)
    }
    
    // Add to history when specs are successfully loaded and displayed
    // This ensures only viewed specs are in history
    if (tagTree.value) {
      newSpecs.forEach(specWithSource => {
        specHistoryStore.addToHistory(specWithSource.spec)
      })
      
      // Save current workspace
      lastWorkspaceStore.saveWorkspace(newSpecs)
    }
    
    // Update URL with spec parameters if not loading from URL
    if (!isLoadingFromUrl) {
      updateUrlWithSpecs(newSpecs)
    }
    
    // Restore state from URL after tree is built
    restoreStateFromRoute()
  } else {
    tagTree.value = null
    // Redirect to selection if no spec
    if (route.path !== '/selection') {
      router.push('/selection')
    }
  }
}, { immediate: true })

// Watch for spec parameter in URL
watch(() => route.query.spec, () => {
  loadSpecsFromUrl()
}, { immediate: true })

// Watch route changes to update state
watch(() => route.path, () => {
  restoreStateFromRoute()
})


const handleOperationSelect = (method: string, path: string) => {
  // Update URL with slug - state will be restored from route
  const slug = endpointPathToSlug(path)
  const methodLower = method.toLowerCase()
  // Preserve spec query parameters when navigating
  const query: Record<string, string | string[]> = { ...route.query }
  
  // Find the spec that contains this operation to get the correct specId
  let specId: string | null = null
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[path]
    if (pathItem) {
      const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
      if (operation) {
        // Found the spec for this operation
        specId = findSpecHash(specWithSource.spec)
        break
      }
    }
  }
  
  // Fallback to query if not found
  if (!specId) {
    specId = getSpecIdFromQuery()
  }
  
  if (specId) {
    router.push({ path: `/spec/${specId}/endpoint/${methodLower}/${slug}`, query })
  } else {
    router.push({ path: `/endpoint/${methodLower}/${slug}`, query })
  }
}

const handleGroupSelect = (node: TagNode) => {
  // Update URL with slug - state will be restored from route
  const slug = toSlug(node.fullPath)
  // Preserve spec query parameters when navigating
  const query: Record<string, string | string[]> = { ...route.query }
  router.push({ path: `/group/${slug}`, query })
}

const handleBackToSelection = () => {
  selectedOperation.value = null
  selectedGroup.value = null
  router.push('/selection')
}

const operationDetails = computed(() => {
  if (specStore.specs.length === 0 || !selectedOperation.value) return null

  // Find the spec that contains this operation
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[selectedOperation.value.path]
    if (pathItem) {
      const operation = pathItem[selectedOperation.value.method.toLowerCase() as keyof typeof pathItem] as Operation | undefined
      if (operation) {
        return {
          method: selectedOperation.value.method,
          path: selectedOperation.value.path,
          operation,
          spec: specWithSource.spec,
          sourceUrl: specWithSource.sourceUrl,
        }
      }
    }
  }

  return null
})
</script>

