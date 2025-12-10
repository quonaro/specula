<template>
  <div class="flex min-h-screen bg-background">
    <div class="w-full p-6">
      <div class="flex gap-6">
        <!-- Left sidebar with accordion (only in example mode) -->
        <div v-if="isExampleMode" class="w-80 shrink-0">
          <Accordion
            :items="accordionItems"
            type="single"
            className="border border-border rounded-lg bg-muted/30"
          >
            <template #trigger="{ item }">
              <span class="font-semibold">{{ item.label }}</span>
            </template>
            <template #content="{ item }">
              <div class="space-y-3">
                <div class="flex gap-2">
                  <input
                    v-model="urlInput"
                    type="url"
                    placeholder="https://example.com/openapi.json"
                    class="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    @keyup.enter="handleLoadFromUrl"
                  />
                  <button
                    @click="handleLoadFromUrl"
                    :disabled="isLoadingUrl || !urlInput.trim()"
                    class="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {{ isLoadingUrl ? 'Loading...' : 'Load' }}
                  </button>
                </div>
                <p v-if="urlError" class="text-sm text-destructive">{{ urlError }}</p>
              </div>
            </template>
          </Accordion>
        </div>

        <!-- Main content area -->
        <div class="flex-1 min-w-0">
          <FileUpload @spec-load="handleSpecLoad" @specs-load="handleSpecsLoad" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import FileUpload from '@/components/FileUpload.vue'
import Accordion from '@/components/ui/Accordion.vue'
import { useSpecStore } from '@/stores/spec'
import { useSpecHistoryStore } from '@/stores/specHistory'
import { useToast } from '@/composables/useToast'
import type { OpenAPISpec } from '@/types/openapi'

const router = useRouter()
const specStore = useSpecStore()
const specHistoryStore = useSpecHistoryStore()
const { toast } = useToast()

// Example mode check
const isExampleMode = computed(() => {
  return import.meta.env.VITE_EXAMPLE === 'true'
})

// Accordion items for URL loading
const accordionItems = computed(() => {
  if (!isExampleMode.value) return []
  return [{
    label: 'Load from URL',
    value: 'load-from-url'
  }]
})

// URL loading state
const urlInput = ref('')
const isLoadingUrl = ref(false)
const urlError = ref('')

const handleSpecLoad = (spec: OpenAPISpec, hash?: string, sourceUrl?: string) => {
  // If sourceUrl is provided, use it; otherwise use hash
  if (sourceUrl) {
    specStore.setSpecs([{
      spec,
      sourceUrl,
      title: spec.info?.title || 'Untitled Specification',
    }])
    
    const query: Record<string, string | string[]> = {
      spec: sourceUrl
    }
    router.push({ path: '/', query })
  } else {
    specStore.setSpec(spec)
    
    // Navigate to main page with spec parameter (hash or URL)
    // History will be added when spec is actually viewed on Index page
    const query: Record<string, string | string[]> = {}
    if (hash) {
      // Use hash if available
      query.spec = hash
    }
    
    router.push({ path: '/', query })
  }
}

const handleSpecsLoad = (specs: Array<{ spec: OpenAPISpec; hash?: string; sourceUrl?: string }>) => {
  // Convert to SpecWithSource format
  const specsWithSource = specs.map(s => ({
    spec: s.spec,
    sourceUrl: s.sourceUrl,
    title: s.spec.info?.title || 'Untitled Specification',
  }))
  
  specStore.setSpecs(specsWithSource)
  
  // History will be added when specs are actually viewed on Index page
  
  // Build query parameters for multiple specs
  const query: Record<string, string | string[]> = {}
  const specParams: string[] = []
  
  for (const s of specs) {
    if (s.sourceUrl) {
      specParams.push(s.sourceUrl)
    } else if (s.hash) {
      specParams.push(s.hash)
    }
  }
  
  if (specParams.length > 0) {
    query.spec = specParams.length === 1 ? specParams[0] : specParams
  }
  
  router.push({ path: '/', query })
}

const handleLoadFromUrl = async () => {
  const url = urlInput.value.trim()
  if (!url) {
    urlError.value = 'Please enter a URL'
    return
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    urlError.value = 'Please enter a valid URL'
    return
  }

  isLoadingUrl.value = true
  urlError.value = ''

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const spec = await response.json()

    // Validate OpenAPI spec
    if (!spec.openapi || !spec.paths) {
      throw new Error('Invalid OpenAPI specification - missing required fields (openapi, paths)')
    }

    const openApiSpec = spec as OpenAPISpec

    // Load the specification with source URL
    handleSpecLoad(openApiSpec, undefined, url)

    toast({
      title: 'Loaded',
      description: `Successfully loaded ${openApiSpec.info?.title || 'OpenAPI specification'} from URL`,
    })

    urlInput.value = ''
  } catch (error: any) {
    urlError.value = error.message || 'Failed to load specification from URL'
    toast({
      title: 'Failed to load',
      description: `Could not load specification from URL: ${error.message || 'Unknown error'}`,
      variant: 'destructive',
    })
  } finally {
    isLoadingUrl.value = false
  }
}
</script>

