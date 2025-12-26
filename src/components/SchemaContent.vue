<template>
  <div :style="{ marginLeft: depth > 0 ? `${depth * 16}px` : 0 }" class="space-y-2">
    <!-- Don't show description at depth 0 to avoid duplication when called from OperationView -->
    <p v-if="schema.description && depth > 0" class="text-sm text-muted-foreground">
      {{ schema.description }}
    </p>
    
    <div class="flex flex-wrap gap-2">
      <Badge v-if="schema.type" variant="outline">type: {{ schema.type }}</Badge>
      <Badge v-if="schema.format" variant="outline">format: {{ schema.format }}</Badge>
      <Badge v-if="schema.pattern" variant="outline">pattern: {{ schema.pattern }}</Badge>
      <Badge v-if="schema.minimum !== undefined" variant="outline">min: {{ schema.minimum }}</Badge>
      <Badge v-if="schema.maximum !== undefined" variant="outline">max: {{ schema.maximum }}</Badge>
      <Badge v-if="schema.minLength !== undefined" variant="outline">minLength: {{ schema.minLength }}</Badge>
      <Badge v-if="schema.maxLength !== undefined" variant="outline">maxLength: {{ schema.maxLength }}</Badge>
      <Badge v-if="schema.minItems !== undefined" variant="outline">minItems: {{ schema.minItems }}</Badge>
      <Badge v-if="schema.maxItems !== undefined" variant="outline">maxItems: {{ schema.maxItems }}</Badge>
      <Badge v-if="schema.uniqueItems" variant="outline">uniqueItems</Badge>
      <Badge v-if="schema.readOnly" variant="outline">readOnly</Badge>
      <Badge v-if="schema.writeOnly" variant="outline">writeOnly</Badge>
      <Badge v-if="schema.deprecated" variant="destructive">deprecated</Badge>
    </div>

    <div v-if="schema.enum" class="mt-2">
      <span class="text-sm font-medium">Enum values:</span>
      <div class="flex flex-wrap gap-1 mt-1">
        <Badge v-for="(val, idx) in schema.enum" :key="idx" variant="secondary">
          {{ JSON.stringify(val) }}
        </Badge>
      </div>
    </div>

    <div v-if="schema.default !== undefined" class="mt-2">
      <span class="text-sm font-medium">Default:</span>
      <code class="ml-2 px-2 py-1 bg-code-bg rounded text-sm">
        {{ JSON.stringify(schema.default) }}
      </code>
    </div>

    <div v-if="schema.properties" class="mt-3">
      <span class="text-sm font-semibold">Properties:</span>
      <div class="mt-2 space-y-3 border-l-2 border-border pl-3">
        <div v-for="[propName, propSchema] in Object.entries(schema.properties)" :key="propName">
          <div class="flex items-center gap-2">
            <code class="text-sm font-mono">{{ propName }}</code>
            <Badge v-if="isRequired(propName)" variant="destructive" class="text-[10px] px-1.5 py-0">required</Badge>
          </div>
          <SchemaContent :schema="resolver.resolve(propSchema)" :resolver="resolver" :depth="depth + 1" />
        </div>
      </div>
    </div>

    <div v-if="schema.items" class="mt-3">
      <span class="text-sm font-semibold">Array items:</span>
      <SchemaContent :schema="resolver.resolve(schema.items)" :resolver="resolver" :depth="depth + 1" />
    </div>

    <div v-if="schema.example !== undefined" class="mt-2">
      <span class="text-sm font-medium">Example:</span>
      <pre class="mt-1 p-3 bg-code-bg rounded text-sm overflow-x-auto">
        {{ JSON.stringify(schema.example, null, 2) }}
      </pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import Badge from './ui/Badge.vue'

interface Props {
  schema: Schema
  resolver: RefResolver
  depth: number
}

const props = defineProps<Props>()

const isRequired = (propName: string) => {
  return props.schema.required?.includes(propName) || false
}
</script>
