<template>
  <div v-if="servers && servers.length > 0" class="space-y-3">
    <h3 class="text-lg font-semibold flex items-center gap-2">
      <Globe class="w-5 h-5" />
      {{ title }}
    </h3>
    
    <div class="space-y-2">
      <Card v-for="(server, idx) in servers" :key="idx" class="p-3">
        <div class="space-y-2">
          <div class="flex items-start gap-2">
            <code class="text-sm font-mono bg-code-bg px-2 py-1 rounded flex-1">
              {{ server.url }}
            </code>
          </div>
          
          <p v-if="server.description" class="text-sm text-muted-foreground">
            {{ server.description }}
          </p>

          <div v-if="server.variables && Object.keys(server.variables).length > 0" class="mt-2 space-y-1">
            <span class="text-xs font-medium">Variables:</span>
            <div
              v-for="[varName, variable] in Object.entries(server.variables)"
              :key="varName"
              class="flex items-center gap-2 text-sm"
            >
              <Badge variant="outline" class="text-xs">{{ varName }}</Badge>
              <span class="text-muted-foreground">default:</span>
              <code class="text-xs">{{ variable.default }}</code>
              <template v-if="variable.enum && variable.enum.length > 1">
                <span class="text-muted-foreground">options:</span>
                <code class="text-xs">[{{ variable.enum.join(', ') }}]</code>
              </template>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Globe } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import type { Server } from '@/types/openapi'

interface Props {
  servers: Server[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'Servers',
})
</script>

