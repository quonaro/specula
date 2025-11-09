<template>
  <div v-if="callbacks && Object.keys(callbacks).length > 0" class="space-y-4">
    <h3 class="text-lg font-semibold">Callbacks</h3>
    <p class="text-sm text-muted-foreground">
      Webhooks that may be triggered by this operation
    </p>
    <Accordion
      :items="accordionItems"
      type="single"
    >
      <template #trigger="{ item }">
        <span class="font-medium">{{ item.label || item.value }}</span>
      </template>
      <template #content="{ item }">
        <div class="space-y-3">
          <div
            v-for="expr in (item as any).expressions"
            :key="expr.expression"
          >
            <Card class="p-4">
              <h4 class="text-sm font-mono mb-3 text-muted-foreground">
                Expression: <code class="text-foreground">{{ expr.expression }}</code>
              </h4>
              <div class="space-y-3">
                <div
                  v-for="op in expr.operations"
                  :key="`${op.method}-${expr.expression}`"
                  class="border-b pb-3 last:border-b-0"
                >
                  <div class="flex items-center gap-2 mb-2">
                    <Badge :class="`${getMethodColorClass(op.method)} text-white`">
                      {{ op.method.toUpperCase() }}
                    </Badge>
                    <span class="text-sm">{{ op.operation.summary || 'Callback operation' }}</span>
                  </div>
                  <div v-if="op.operation.description" class="text-sm text-muted-foreground mb-2">
                    {{ op.operation.description }}
                  </div>
                  <div v-if="op.operation.requestBody" class="space-y-2">
                    <h5 class="text-sm font-semibold">Request Body:</h5>
                    <div
                      v-for="[contentType, mediaType] in Object.entries(op.operation.requestBody.content || {})"
                      :key="contentType"
                    >
                      <Card class="p-3">
                        <Badge variant="outline" class="mb-2">{{ contentType }}</Badge>
                        <SchemaView
                          v-if="mediaType?.schema"
                          :schema="mediaType.schema"
                          :resolver="resolver"
                        />
                      </Card>
                    </div>
                  </div>
                  <div v-if="op.operation.responses" class="space-y-2 mt-2">
                    <h5 class="text-sm font-semibold">Responses:</h5>
                    <Card
                      v-for="[statusCode, response] in Object.entries(op.operation.responses)"
                      :key="statusCode"
                      class="p-3"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{{ statusCode }}</Badge>
                        <span class="text-sm">{{ resolver.resolve(response).description }}</span>
                      </div>
                      <div
                        v-if="resolver.resolve(response).content"
                        v-for="[ct, mt] in Object.entries(resolver.resolve(response).content || {})"
                        :key="ct"
                        class="mt-2"
                      >
                        <Badge variant="secondary" class="mb-2">{{ ct }}</Badge>
                        <SchemaView
                          v-if="mt?.schema"
                          :schema="mt.schema"
                          :resolver="resolver"
                        />
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </template>
    </Accordion>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Callback, PathItem, Operation } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import { getMethodColorClass } from '@/utils/operation-cache'
import Card from './ui/Card.vue'
import Badge from './ui/Badge.vue'
import Accordion from './ui/Accordion.vue'
import SchemaView from './SchemaView.vue'

interface Props {
  callbacks: Record<string, Callback>
  resolver: RefResolver
}

const props = defineProps<Props>()

const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'] as const

const accordionItems = computed(() => {
  return Object.entries(props.callbacks).map(([callbackName, callback]) => {
    const resolvedCallback = props.resolver.resolve<Callback>(callback)
    const expressions = Object.keys(resolvedCallback)
      .filter(k => k !== '$ref')
      .map(expr => {
        const pathItem = resolvedCallback[expr]
        if (typeof pathItem === 'string' || !pathItem) {
          return { expression: expr, operations: [] }
        }
        
        const resolvedPath = props.resolver.resolve<PathItem>(pathItem)
        const operations = methods
          .map(method => {
            const operation = resolvedPath[method]
            if (!operation) return null
            return { method: method.toUpperCase(), operation }
          })
          .filter((op): op is { method: string; operation: Operation } => op !== null)
        
        return { expression: expr, operations }
      })
      .filter(expr => expr.operations.length > 0)
    
    return {
      label: callbackName,
      value: callbackName,
      expressions,
    }
  })
})

</script>

