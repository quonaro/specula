<template>
  <div v-if="links && Object.keys(links).length > 0" class="space-y-4">
    <h3 class="text-lg font-semibold">Links</h3>
    <p class="text-sm text-muted-foreground">
      Links to other operations that can be performed using values from this response
    </p>
    
    <div class="space-y-3">
      <Card
        v-for="[linkName, link] in Object.entries(links)"
        :key="linkName"
        class="p-4"
      >
        <div class="flex items-start gap-2 mb-2">
          <ExternalLink class="w-4 h-4 mt-0.5 text-primary" />
          <h4 class="font-medium">{{ linkName }}</h4>
        </div>
        
        <p v-if="resolvedLink(link).description" class="text-sm text-muted-foreground mb-3">
          {{ resolvedLink(link).description }}
        </p>

        <div class="space-y-2">
          <div v-if="resolvedLink(link).operationId" class="flex items-center gap-2">
            <Badge variant="outline">Operation ID</Badge>
            <code class="text-sm">{{ resolvedLink(link).operationId }}</code>
          </div>

          <div v-if="resolvedLink(link).operationRef" class="flex items-center gap-2">
            <Badge variant="outline">Operation Ref</Badge>
            <code class="text-sm">{{ resolvedLink(link).operationRef }}</code>
          </div>

          <div
            v-if="resolvedLink(link).parameters && Object.keys(resolvedLink(link).parameters || {}).length > 0"
            class="space-y-1"
          >
            <span class="text-sm font-medium">Parameters:</span>
            <pre class="mt-1 p-2 bg-code-bg rounded text-xs overflow-x-auto">
              {{ JSON.stringify(resolvedLink(link).parameters, null, 2) }}
            </pre>
          </div>

          <div v-if="resolvedLink(link).requestBody !== undefined" class="space-y-1">
            <span class="text-sm font-medium">Request Body:</span>
            <pre class="mt-1 p-2 bg-code-bg rounded text-xs overflow-x-auto">
              {{ JSON.stringify(resolvedLink(link).requestBody, null, 2) }}
            </pre>
          </div>

          <div v-if="resolvedLink(link).server" class="flex items-center gap-2">
            <Badge variant="secondary">Server</Badge>
            <code class="text-sm">{{ resolvedLink(link).server?.url }}</code>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import type { Link } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'

interface Props {
  links: Record<string, Link>
  resolver: RefResolver
}

const props = defineProps<Props>()

const resolvedLink = (link: Link) => {
  return props.resolver.resolve<Link>(link)
}
</script>

