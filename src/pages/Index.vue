<template>
  <div v-if="!spec || !tagTree" class="h-screen">
    <FileUpload @spec-load="handleSpecLoad" />
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
                {{ spec.info?.title || 'OpenAPI Specification' }}
              </h1>
              <p class="text-xs text-muted-foreground">
                v{{ spec.info?.version || '1.0.0' }} | OpenAPI {{ spec.openapi }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="handleDownload">
              <Download class="h-4 w-4 mr-2" />
              Download
            </Button>
            <ThemeToggle />
          </div>
        </div>
        
        <!-- Global info banner -->
        <div
          v-if="spec.info.description || (spec.servers && spec.servers.length > 0) || spec.externalDocs"
          class="px-6 py-3 bg-muted/30 border-t border-border text-sm space-y-2"
        >
          <p v-if="spec.info.description" class="text-muted-foreground">
            {{ spec.info.description }}
          </p>
          <div v-if="spec.servers && spec.servers.length > 0" class="flex items-center gap-2 flex-wrap">
            <span class="font-medium">Servers:</span>
            <code
              v-for="(server, idx) in spec.servers"
              :key="idx"
              class="px-2 py-0.5 bg-code-bg rounded text-xs"
            >
              {{ server.url }}
            </code>
          </div>
          <a
            v-if="spec.externalDocs"
            :href="spec.externalDocs.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline inline-flex items-center gap-1"
          >
            📖 {{ spec.externalDocs.description || 'External Documentation' }}
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download } from 'lucide-vue-next'
import FileUpload from '@/components/FileUpload.vue'
import Sidebar from '@/components/Sidebar.vue'
import OperationView from '@/components/OperationView.vue'
import GroupEndpointsView from '@/components/GroupEndpointsView.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import Button from '@/components/ui/Button.vue'
import { useToast } from '@/composables/useToast'
import type { OpenAPISpec, TagNode, Operation } from '@/types/openapi'
import { parseOpenAPISpec, findNodeByPath, findNodeBySlug, toSlug, endpointPathToSlug, slugToEndpointPath } from '@/utils/openapi-parser'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()
const spec = ref<OpenAPISpec | null>(null)
const tagTree = ref<TagNode | null>(null)
const selectedOperation = ref<{ method: string; path: string } | null>(null)
const selectedGroup = ref<TagNode | null>(null)

watch(spec, (newSpec) => {
  if (newSpec) {
    const tree = parseOpenAPISpec(newSpec)
    tagTree.value = tree
    // Restore state from URL after tree is built
    restoreStateFromRoute()
  }
})

// Watch route changes to update state
watch(() => route.path, () => {
  restoreStateFromRoute()
})

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
  } else if (path.startsWith('/endpoint/')) {
    const method = (route.params.method as string).toUpperCase()
    const endpointSlug = route.params.path as string
    
    // Convert slug back to endpoint path
    const endpointPath = slugToEndpointPath(endpointSlug)
    
    // Verify endpoint exists in spec
    if (spec.value && spec.value.paths[endpointPath]) {
      const pathItem = spec.value.paths[endpointPath]
      const operation = pathItem[method.toLowerCase() as keyof typeof pathItem]
      if (operation) {
        selectedOperation.value = { method, path: endpointPath }
        selectedGroup.value = null
      } else {
        // Endpoint not found, redirect to home
        router.replace('/')
      }
    } else {
      // Try to find by matching slug pattern
      // Search through all paths to find matching endpoint
      let foundPath: string | null = null
      if (spec.value) {
        for (const [path, pathItem] of Object.entries(spec.value.paths)) {
          const pathSlug = endpointPathToSlug(path)
          if (pathSlug === endpointSlug) {
            const op = pathItem[method.toLowerCase() as keyof typeof pathItem]
            if (op) {
              foundPath = path
              break
            }
          }
        }
      }
      
      if (foundPath) {
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
  }
}

const handleSpecLoad = (loadedSpec: OpenAPISpec) => {
  spec.value = loadedSpec
  // Reset to home when loading new spec
  if (route.path !== '/') {
    router.replace('/')
  }
}

const handleDownload = () => {
  if (!spec.value) return

  const blob = new Blob([JSON.stringify(spec.value, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${spec.value.info?.title || 'openapi'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toast({
    title: 'Downloaded',
    description: 'OpenAPI specification downloaded successfully',
  })
}

const handleOperationSelect = (method: string, path: string) => {
  // Update URL with slug - state will be restored from route
  const slug = endpointPathToSlug(path)
  const methodLower = method.toLowerCase()
  router.push(`/endpoint/${methodLower}/${slug}`)
}

const handleGroupSelect = (node: TagNode) => {
  // Update URL with slug - state will be restored from route
  const slug = toSlug(node.fullPath)
  router.push(`/group/${slug}`)
}

const operationDetails = computed(() => {
  if (!spec.value || !selectedOperation.value) return null

  const pathItem = spec.value.paths[selectedOperation.value.path]
  if (!pathItem) return null

  const operation = pathItem[selectedOperation.value.method.toLowerCase() as keyof typeof pathItem] as Operation | undefined
  if (!operation) return null

  return {
    method: selectedOperation.value.method,
    path: selectedOperation.value.path,
    operation,
    spec: spec.value,
  }
})
</script>

