<template>
  <Card class="p-6 space-y-4">
    <h3 class="text-lg font-semibold text-foreground">Parameters</h3>
    <div class="space-y-3">
      <div v-for="(param, idx) in operation.parameters" :key="idx"
        class="border border-border rounded-lg p-4 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <code class="text-sm font-semibold text-foreground">
            {{ resolver.resolve(param).name }}
          </code>
          <Badge variant="outline" class="text-xs">
            {{ resolver.resolve(param).in }}
          </Badge>
          <Badge v-if="resolver.resolve(param).required" variant="destructive"
            class="text-[10px] px-1.5 py-0">
            required
          </Badge>
          <Badge v-if="resolver.resolve(param).deprecated" variant="destructive" class="text-xs">
            deprecated
          </Badge>
        </div>
        <p v-if="resolver.resolve(param).description" class="text-sm text-muted-foreground">
          {{ resolver.resolve(param).description }}
        </p>
        <div v-if="resolver.resolve(param).schema" class="mt-2">
          <SchemaView :schema="resolver.resolve(param).schema!" :resolver="resolver" />
        </div>
        <div
          v-if="resolver.resolve(param).examples && Object.keys(resolver.resolve(param).examples || {}).length > 0"
          class="mt-2">
          <span class="text-xs font-medium">Examples:</span>
          <div v-for="[exName, ex] in Object.entries(resolver.resolve(param).examples || {})" :key="exName"
            class="mt-1">
            <Badge variant="secondary" class="text-xs mb-1">{{ exName }}</Badge>
            <p v-if="resolver.resolve(ex).description" class="text-xs text-muted-foreground">
              {{ resolver.resolve(ex).description }}
            </p>
            <pre v-if="resolver.resolve(ex).value !== undefined"
              class="text-xs bg-code-bg px-2 py-1 rounded mt-1">
              {{ JSON.stringify(resolver.resolve(ex).value, null, 2) }}
            </pre>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import type { Operation, OpenAPISpec } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import SchemaView from '../SchemaView.vue'

interface Props {
  operation: Operation
  spec: OpenAPISpec
}

const props = defineProps<Props>()

const resolver = new RefResolver(props.spec)
</script>


