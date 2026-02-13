<template>
  <div v-if="specStore.specs.length === 0 || !tagTree" class="h-screen flex items-center justify-center">
    <div class="text-center space-y-4">
      <p class="text-lg text-muted-foreground">No specification loaded</p>
      <Button v-if="!isStandaloneMode()" @click="router.push('/selection')">
        Go to Selection
      </Button>
    </div>
  </div>

  <div v-else class="flex h-screen w-full bg-background" @click="handleClickOutsideSearch">
    <Sidebar 
      :root="tagTree" 
      :selected-operation="selectedOperation" 
      @operation-select="handleOperationSelect"
      @group-select="handleGroupSelect"
      @history-select="handleHistorySelect"
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
          <div class="flex items-center gap-2 flex-1 max-w-2xl mx-4">
            <div class="relative flex-1 global-search-container">
              <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input v-model="globalSearchQuery" placeholder="Search all endpoints..." class="pl-8 h-9 text-sm"
                autocomplete="off" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-dashlane-ignore="true" data-form-type="other" type="search"
                name="search-endpoints" id="global-search-input"
                @focus="showGlobalSearchResults = true" @keydown.escape="showGlobalSearchResults = false" />
              <div v-if="showGlobalSearchResults && globalSearchResults.length > 0"
                class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
                @click.stop>
                <div v-for="(result, idx) in globalSearchResults" :key="idx"
                  class="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                  @click="handleGlobalSearchSelect(result)">
                  <div class="flex items-center gap-2 mb-1">
                    <span :class="[
                      'text-xs font-bold px-2 py-0.5 rounded text-white',
                      getMethodColorClass(result.method)
                    ]">
                      {{ result.method }}
                    </span>
                    <span class="text-sm font-medium text-foreground flex-1 truncate">
                      {{ result.path }}
                    </span>
                    <span v-if="result.specTitle" class="text-xs text-muted-foreground truncate max-w-[120px]">
                      {{ result.specTitle }}
                    </span>
                  </div>
                  <p v-if="result.operation.summary" class="text-xs text-muted-foreground line-clamp-1">
                    {{ result.operation.summary }}
                  </p>
                </div>
              </div>
              <div v-if="showGlobalSearchResults && globalSearchQuery && globalSearchResults.length === 0"
                class="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 p-4 text-center text-sm text-muted-foreground"
                @click.stop>
                No results found
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button v-if="hasSecuritySchemes" variant="outline" size="sm" @click="handleAuthorizationClick">
              <Key class="h-4 w-4 mr-2" />
              Authorization
            </Button>
            <Button v-if="!isStandaloneMode()" variant="outline" size="sm" @click="handleBackToSelection">
              <ArrowLeft class="h-4 w-4 mr-2" />
              Back to Selection
            </Button>
            <Button variant="outline" size="sm" @click="showExportDialog = true">
              <Download class="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" @click="showSettingsDialog = true">
              <Settings class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Global info banner -->
        <div
          v-if="specStore.specs.length === 1 && specStore.specs[0].spec && (specStore.specs[0].spec.info.description || (specStore.specs[0].spec.servers && specStore.specs[0].spec.servers.length > 0) || specStore.specs[0].spec.externalDocs)"
          class="px-6 py-3 bg-muted/30 border-t border-border text-sm space-y-2">
          <p v-if="specStore.specs[0].spec.info.description" class="text-muted-foreground">
            {{ specStore.specs[0].spec.info.description }}
          </p>
          <div v-if="specStore.specs[0].spec.servers && specStore.specs[0].spec.servers.length > 0"
            class="flex items-center gap-2 flex-wrap">
            <span class="font-medium">Servers:</span>
            <code v-for="(server, idx) in specStore.specs[0].spec.servers" :key="idx"
              class="px-2 py-0.5 bg-code-bg rounded text-xs">
              {{ server.url }}
            </code>
          </div>
          <a v-if="specStore.specs[0].spec.externalDocs" :href="specStore.specs[0].spec.externalDocs.url"
            target="_blank" rel="noopener noreferrer"
            class="text-primary hover:underline inline-flex items-center gap-1">
            📖 {{ specStore.specs[0].spec.externalDocs.description || 'External Documentation' }}
          </a>
        </div>
      </header>

      <main class="flex-1 overflow-hidden">
        <GroupEndpointsView v-if="selectedGroup" :group-node="selectedGroup" :selected-operation="selectedOperation"
          @select-operation="handleOperationSelect" />
        <OperationView v-else-if="operationDetails" :method="operationDetails.method" :path="operationDetails.path"
          :operation="operationDetails.operation" :spec="operationDetails.spec"
          :source-url="operationDetails.sourceUrl" />
        <div v-else class="flex items-center justify-center h-full">
          <div class="text-center space-y-2">
            <img :src="logoUrl" alt="Logo" class="mx-auto h-16 w-16 logo-image-opacity" />
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

    <!-- Export Dialog -->
    <ExportDialog v-model="showExportDialog" :specs="specStore.specs" />

    <!-- Settings Dialog -->
    <SettingsDialog v-model="showSettingsDialog" />

    <!-- Authorization Settings Dialog -->
    <AuthorizationSettingsDialog v-if="selectedSpecForAuth" v-model="showAuthorizationDialog"
      :spec="selectedSpecForAuth.spec" :source-url="selectedSpecForAuth.sourceUrl" />

    <!-- Spec Selection Dialog for Authorization -->
    <Dialog v-if="!isStandaloneMode()" v-model="showSpecSelectionDialog" title="Select Specification"
      :close-on-backdrop="true">
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Select a specification to configure authorization credentials.
        </p>
        <div class="space-y-2">
          <Button v-for="(specWithSource, idx) in specsWithSecuritySchemes" :key="idx" variant="outline" size="sm"
            @click="selectSpecForAuthorization(specWithSource)" class="w-full justify-start">
            <Key class="w-4 h-4 mr-2" />
            {{ specWithSource.spec?.info?.title || specWithSource.title || 'Untitled Specification' }}
          </Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, ArrowLeft, Key, Github, Search, Settings } from 'lucide-vue-next'
import Sidebar from '@/components/Sidebar.vue'
import ExportDialog from '@/components/ExportDialog.vue'
import AuthorizationSettingsDialog from '@/components/AuthorizationSettingsDialog.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import Dialog from '@/components/ui/Dialog.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

// Lazy load heavy components for better code splitting
const OperationView = defineAsyncComponent(() => import('@/components/OperationView.vue'))
const GroupEndpointsView = defineAsyncComponent(() => import('@/components/GroupEndpointsView.vue'))
import type { SpecWithSource } from '@/stores/spec'
import { useToast } from '@/composables/useToast'
import { useSpecStore } from '@/stores/spec'
import { useSpecCacheStore, isHash } from '@/stores/specCache'
import { useSpecHistoryStore } from '@/stores/specHistory'
import { useLastWorkspaceStore } from '@/stores/lastWorkspace'
import type { OpenAPISpec, TagNode, Operation } from '@/types/openapi'
import type { RequestHistoryItem } from '@/stores/requestHistory'
import { parseOpenAPISpec, parseMultipleSpecs, findNodeByPath, findNodeBySlug, toSlug, endpointPathToSlug, slugToEndpointPath, getOperationId, findOperationById } from '@/utils/openapi-parser'
import { clearOperationCaches } from '@/utils/operation-cache'
import { searchAllOperations, type SearchResult } from '@/utils/search'
import { getMethodColorClass } from '@/utils/operation-cache'
import { getLogoUrl } from '@/utils/logo'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const specStore = useSpecStore()
const specCacheStore = useSpecCacheStore()
const specHistoryStore = useSpecHistoryStore()
const lastWorkspaceStore = useLastWorkspaceStore()

// Check if running in standalone mode
const isStandaloneMode = () => {
  return typeof window !== 'undefined' && (window as any).__SPECULA_STANDALONE__ === true
}

const logoUrl = computed(() => getLogoUrl())
const tagTree = ref<TagNode | null>(null)
const selectedOperation = ref<{ method: string; path: string } | null>(null)
const selectedGroup = ref<TagNode | null>(null)
const showExportDialog = ref(false)
const showAuthorizationDialog = ref(false)
const showSpecSelectionDialog = ref(false)
const showSettingsDialog = ref(false)
const selectedSpecForAuth = ref<SpecWithSource | null>(null)
const globalSearchQuery = ref('')
const showGlobalSearchResults = ref(false)
const globalSearchResults = computed<SearchResult[]>(() => {
  if (!globalSearchQuery.value.trim()) {
    return []
  }
  return searchAllOperations(specStore.specs, globalSearchQuery.value)
})

// Check if Example mode is enabled
const isExampleMode = computed(() => {
  return import.meta.env.VITE_EXAMPLE === 'true'
})

// Check if any spec has security schemes
// Optimized: cache specs array to avoid reactive lookups
const hasSecuritySchemes = computed(() => {
  const specs = specStore.specs
  return specs.some(spec => {
    const securitySchemes = spec.spec?.components?.securitySchemes
    return securitySchemes && Object.keys(securitySchemes).length > 0
  })
})

// Get specs that have security schemes
// Optimized: cache specs array to avoid reactive lookups
const specsWithSecuritySchemes = computed(() => {
  const specs = specStore.specs
  return specs.filter(spec => {
    const securitySchemes = spec.spec?.components?.securitySchemes
    return securitySchemes && Object.keys(securitySchemes).length > 0
  })
})

// Handle authorization button click
const handleAuthorizationClick = () => {
  const specsWithSecurity = specsWithSecuritySchemes.value
  if (specsWithSecurity.length === 1) {
    // Only one spec with security schemes: open dialog directly
    selectedSpecForAuth.value = specsWithSecurity[0]
    showAuthorizationDialog.value = true
  } else if (specsWithSecurity.length > 1) {
    // Multiple specs with security schemes: show selection dialog
    showSpecSelectionDialog.value = true
  }
}

// Select spec for authorization
const selectSpecForAuthorization = (specWithSource: SpecWithSource) => {
  selectedSpecForAuth.value = specWithSource
  showSpecSelectionDialog.value = false
  showAuthorizationDialog.value = true
}

// Watch for dialog close and clear selection
watch(showAuthorizationDialog, (isOpen) => {
  if (!isOpen) {
    // Clear selection when dialog closes
    selectedSpecForAuth.value = null
  }
})

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

// Find first operation in tag tree (for auto-opening in standalone mode)
const findFirstOperation = (node: TagNode): { method: string; path: string } | null => {
  // Check if current node has operations
  if (node.operations.length > 0) {
    const firstOp = node.operations[0]
    return { method: firstOp.method, path: firstOp.path }
  }

  // Recursively check children (sorted for consistent ordering)
  const sortedChildren = Array.from(node.children.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  for (const child of sortedChildren) {
    const found = findFirstOperation(child)
    if (found) {
      return found
    }
  }

  return null
}

// Restore state from route
const restoreStateFromRoute = () => {
  if (!tagTree.value) return

  const path = route.path

  // Handle standalone mode with simplified routing format: /:method/:operationId
  if (isStandaloneMode() && path !== '/' && !path.startsWith('/group/')) {
    const pathSegments = path.split('/').filter(s => s.length > 0)

    // Check if path matches format /:method/:operationId
    if (pathSegments.length >= 2) {
      const method = pathSegments[0]?.toUpperCase()
      const operationIdFromUrl = pathSegments.slice(1).join('/')

      // Valid HTTP methods
      const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE']

      if (method && validMethods.includes(method)) {
        // Try to find operation by operationId
        const found = findOperationById(specStore.specs, operationIdFromUrl)
        
        if (found) {
          selectedOperation.value = { method: found.method, path: found.path }
          selectedGroup.value = null
        } else {
          // Endpoint not found, redirect to home
          router.replace('/')
        }

        return
      } else {
        // Invalid HTTP method, redirect to home
        router.replace('/')
        return
      }
    } else if (pathSegments.length > 0) {
      // Path doesn't match expected format, redirect to home
      router.replace('/')
      return
    }
  }

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
    // New format: /spec/{specId}/endpoint/{method}/{operationId}
    const method = (route.params.method as string).toUpperCase()
    const operationIdFromUrl = route.params.path as string

    // Try to find operation by operationId
    const found = findOperationById(specStore.specs, operationIdFromUrl)
    
    if (found && found.method === method) {
      selectedOperation.value = { method: found.method, path: found.path }
      selectedGroup.value = null
    } else {
      // Endpoint not found, redirect to home
      router.replace('/')
    }
  } else if (path.startsWith('/endpoint/')) {
    // Format: /endpoint/{method}/{operationId}
    const method = (route.params.method as string).toUpperCase()
    const operationIdFromUrl = route.params.path as string

    // Try to find operation by operationId
    const found = findOperationById(specStore.specs, operationIdFromUrl)
    
    if (found && found.method === method) {
      selectedOperation.value = { method: found.method, path: found.path }
      selectedGroup.value = null
      
      // Get specId from the found spec or fallback to query
      const specId = findSpecHash(found.spec) || getSpecIdFromQuery()
      if (specId && isHash(specId)) {
        const query: Record<string, string | string[]> = { ...route.query }
        router.replace({ path: `/spec/${specId}/endpoint/${method.toLowerCase()}/${operationIdFromUrl}`, query })
      }
    } else {
      // Endpoint not found, redirect to home
      router.replace('/')
    }
  } else if (path === '/') {
    // Root path - show empty state (no operation selected)
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
          if (specId && isHash(specId)) {
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
    // Don't redirect to selection in standalone mode
    if (specStore.specs.length === 0 && route.path !== '/selection' && !isStandaloneMode()) {
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
    // In standalone mode, only add spec parameter if needed for initial load or multiple specs
    if (!isLoadingFromUrl) {
      // In standalone mode, preserve existing spec query if specs match what's already loaded
      // This avoids unnecessary query parameters when navigating between endpoints
      if (isStandaloneMode() && route.query.spec) {
        // Check if current specs match what's in query - if so, keep it
        // Otherwise update (e.g., when new spec is loaded)
        const currentSpecParams = route.query.spec
        const specValues = Array.isArray(currentSpecParams)
          ? currentSpecParams
          : [currentSpecParams]

        // Only update if specs changed (different count or sources)
        const specsChanged = newSpecs.length !== specValues.length ||
          newSpecs.some((spec, idx) => {
            const cachedSpecs = Array.from(specCacheStore.cache.values())
            if (spec.sourceUrl) {
              return spec.sourceUrl !== specValues[idx]
            } else {
              const cached = cachedSpecs.find(c => c.spec === spec.spec)
              return cached?.hash !== specValues[idx]
            }
          })

        if (specsChanged) {
          updateUrlWithSpecs(newSpecs)
        }
      } else {
        updateUrlWithSpecs(newSpecs)
      }
    }

    // Restore state from URL after tree is built
    restoreStateFromRoute()
  } else {
    tagTree.value = null
    // Redirect to selection if no spec (but not in standalone mode)
    if (route.path !== '/selection' && !isStandaloneMode()) {
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


// Handle global search result selection
const handleGlobalSearchSelect = (result: SearchResult) => {
  // Find the spec by index
  const spec = specStore.specs[result.specIndex]
  if (!spec) return

  // Get operationId from the operation
  const operationId = getOperationId(result.operation, result.method, result.path)

  // In standalone mode, use simplified format: /:method/:operationId
  if (isStandaloneMode()) {
    const newPath = `/${result.method.toUpperCase()}/${operationId}`

    // Add spec to query if multiple specs exist
    const query: Record<string, string | string[]> = {}
    if (specStore.specs.length > 1) {
      const specId = findSpecHash(spec.spec)
      if (specId) {
        query.spec = specId
      }
    }

    router.push({ path: newPath, query })
  } else {
    // Non-standalone mode: use operationId format
    const specId = findSpecHash(spec.spec)
    if (specId && isHash(specId)) {
      router.push({
        path: `/spec/${specId}/endpoint/${result.method.toLowerCase()}/${operationId}`
      })
    } else {
      router.push({
        path: `/endpoint/${result.method.toLowerCase()}/${operationId}`
      })
    }
  }

  // Close search results
  showGlobalSearchResults.value = false
  globalSearchQuery.value = ''

  // Select the operation
  selectedOperation.value = { method: result.method, path: result.path }
}

// Handle click outside search to close results
const handleClickOutsideSearch = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.global-search-container')) {
    showGlobalSearchResults.value = false
  }
}

const handleHistorySelect = (item: RequestHistoryItem) => {
  // Navigate to the endpoint from history
  if (item.path && item.method) {
    // Extract path from URL if needed (remove query params and base URL)
    let path = item.path
    
    // If path starts with http, extract the pathname
    if (path.startsWith('http://') || path.startsWith('https://')) {
      try {
        const url = new URL(path)
        path = url.pathname
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        const match = path.match(/https?:\/\/[^\/]+(\/.*?)(?:\?|$)/)
        if (match) {
          path = match[1]
        }
      }
    }
    
    // Remove query parameters if present
    if (path.includes('?')) {
      path = path.split('?')[0]
    }
    
    // Try to find operation by operationId first (more reliable)
    if (item.operationId) {
      const found = findOperationById(specStore.specs, item.operationId)
      if (found && found.method === item.method.toUpperCase()) {
        handleOperationSelect(found.method, found.path)
        return
      }
    }
    
    // Fallback: try to find by path and method
    handleOperationSelect(item.method, path)
    
    // TODO: In the future, we can restore request parameters and body from history
    // This would require passing the history item to OperationView component
  }
}

const handleOperationSelect = (method: string, path: string) => {
  const methodLower = method.toLowerCase()
  // Preserve spec query parameters when navigating
  const query: Record<string, string | string[]> = { ...route.query }

  // Find the operation to get its operationId
  let operation: Operation | null = null
  let foundSpecWithSource: SpecWithSource | null = null
  
  for (const specWithSource of specStore.specs) {
    const pathItem = specWithSource.spec.paths[path]
    if (pathItem) {
      const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
      if (op) {
        operation = op
        foundSpecWithSource = specWithSource
        break
      }
    }
  }

  // If not found, try to find by spec from query
  if (!operation && specStore.specs.length > 0) {
    const specIdFromQuery = getSpecIdFromQuery()
    if (specIdFromQuery && isHash(specIdFromQuery)) {
      const targetSpec = specCacheStore.getByHash(specIdFromQuery)
      if (targetSpec) {
        for (const specWithSource of specStore.specs) {
          if (specWithSource.spec === targetSpec) {
            const pathItem = specWithSource.spec.paths[path]
            if (pathItem) {
              const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
              if (op) {
                operation = op
                foundSpecWithSource = specWithSource
                break
              }
            }
          }
        }
      }
    }
  }

  // If still not found, use first spec that has this endpoint
  if (!operation) {
    for (const specWithSource of specStore.specs) {
      const pathItem = specWithSource.spec.paths[path]
      if (pathItem) {
        const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
        if (op) {
          operation = op
          foundSpecWithSource = specWithSource
          break
        }
      }
    }
  }

  if (!operation) {
    console.error('Operation not found:', method, path)
    return
  }

  // Get operationId (or fallback)
  const operationId = getOperationId(operation, method, path)

  // In standalone mode, use simplified format: /:method/:operationId
  if (isStandaloneMode()) {
    // In standalone mode, only add spec to query if:
    // 1. Multiple specs exist (to identify which one)
    // 2. Spec was loaded from URL parameter (preserve it)
    const hasSpecInQuery = route.query.spec
    if (foundSpecWithSource && specStore.specs.length > 1 && hasSpecInQuery) {
      // Preserve existing spec query if multiple specs
    } else if (foundSpecWithSource && specStore.specs.length > 1) {
      // Only add spec parameter if multiple specs and not already in query
      const specId = findSpecHash(foundSpecWithSource.spec)
      if (specId) {
        query.spec = specId
      }
    } else if (hasSpecInQuery) {
      // Preserve spec parameter if it exists (for initial load or multiple specs)
      // But remove it if single spec and navigating normally
      if (specStore.specs.length === 1) {
        delete query.spec
      }
    }

    // Build path: /:method/:operationId
    const newPath = `/${method.toUpperCase()}/${operationId}`
    router.push({ path: newPath, query })
    return
  }

  // Non-standalone mode: use operationId format
  // Find the spec that contains this operation to get the correct specId
  let specId: string | null = null
  if (foundSpecWithSource) {
    specId = findSpecHash(foundSpecWithSource.spec)
  }

  // Fallback to query if not found
  if (!specId) {
    specId = getSpecIdFromQuery()
  }

  if (specId && isHash(specId)) {
    router.push({ path: `/spec/${specId}/endpoint/${methodLower}/${operationId}`, query })
  } else {
    router.push({ path: `/endpoint/${methodLower}/${operationId}`, query })
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
  // Don't navigate to selection in standalone mode
  if (!isStandaloneMode()) {
    router.push('/selection')
  }
}

// Compute page title based on selected operation/group/spec
// Optimized: cache reactive data access to avoid multiple reactive lookups
const pageTitle = computed(() => {
  // Cache specs array and length to avoid multiple reactive lookups
  const specs = specStore.specs
  const specsLength = specs.length
  
  // If no specs loaded
  if (specsLength === 0) {
    return 'Specula'
  }

  // If operation is selected
  if (selectedOperation.value) {
    const { method, path } = selectedOperation.value

    // Find the operation and spec
    let operation: Operation | null = null
    let specTitle: string | undefined = undefined

    // Cache specs array reference to avoid reactive lookups in loop
    for (const specWithSource of specs) {
      const pathItem = specWithSource.spec.paths[path]
      if (pathItem) {
        const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
        if (op) {
          operation = op
          specTitle = specWithSource.title || specWithSource.spec?.info?.title
          break
        }
      }
    }

    if (operation) {
      const summary = operation.summary || operation.operationId || path
      const parts = [method, path]
      if (summary && summary !== path) {
        parts.unshift(summary)
      }
      // Use cached specsLength instead of accessing specStore.specs.length again
      if (specTitle && specsLength > 1) {
        parts.push(`- ${specTitle}`)
      }
      return `${parts.join(' ')} | Specula`
    }

    // Fallback if operation not found
    return `${method} ${path} | Specula`
  }

  // If group is selected
  if (selectedGroup.value) {
    const groupName = selectedGroup.value.name
    // Cache first spec access
    const specTitle = specsLength === 1
      ? (specs[0].title || specs[0].spec?.info?.title)
      : undefined

    // Use cached specsLength
    if (specTitle && specsLength > 1) {
      return `${groupName} - ${specTitle} | Specula`
    }
    return `${groupName} | Specula`
  }

  // Default: show spec title(s)
  // Use cached specsLength and first spec
  if (specsLength === 1) {
    const specTitle = specs[0].title || specs[0].spec?.info?.title || 'OpenAPI Specification'
    return `${specTitle} | Specula`
  }

  return `${specsLength} Specifications | Specula`
})

// Watch page title and update document.title
watch(pageTitle, (newTitle) => {
  if (typeof document !== 'undefined') {
    document.title = newTitle
  }
}, { immediate: true })

const operationDetails = computed(() => {
  // Cache specs array and selectedOperation to avoid multiple reactive lookups
  const specs = specStore.specs
  const selectedOp = selectedOperation.value
  
  if (specs.length === 0 || !selectedOp) return null

  // Cache method and path to avoid repeated property access
  const method = selectedOp.method.toLowerCase()
  const path = selectedOp.path

  // Find the spec that contains this operation
  // Use cached specs array reference
  for (const specWithSource of specs) {
    const pathItem = specWithSource.spec.paths[path]
    if (pathItem) {
      const operation = pathItem[method as keyof typeof pathItem] as Operation | undefined
      if (operation) {
        return {
          method: selectedOp.method,
          path: selectedOp.path,
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
