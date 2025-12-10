<template>
  <div class="flex min-h-screen bg-background">
    <div class="w-full p-6">
      <FileUpload @spec-load="handleSpecLoad" @specs-load="handleSpecsLoad" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import FileUpload from '@/components/FileUpload.vue'
import { useSpecStore } from '@/stores/spec'
import { useSpecHistoryStore } from '@/stores/specHistory'
import type { OpenAPISpec } from '@/types/openapi'

const router = useRouter()
const specStore = useSpecStore()
const specHistoryStore = useSpecHistoryStore()

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
</script>

