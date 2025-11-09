<template>
  <div class="space-y-4">
    <h3 v-if="title" class="text-lg font-semibold">{{ title }}</h3>
    
    <div v-if="resolvedSchema.allOf">
      <p class="text-sm text-muted-foreground">All of the following schemas must be satisfied:</p>
      <Card
        v-for="(s, idx) in resolvedSchema.allOf"
        :key="idx"
        class="p-4"
      >
        <h4 class="font-medium mb-2">Schema {{ idx + 1 }}</h4>
        <SchemaContent :schema="resolver.resolve(s)" :resolver="resolver" :depth="0" />
      </Card>
    </div>
    
    <div v-else-if="resolvedSchema.oneOf" class="space-y-4">
      <p class="text-sm text-muted-foreground">One of the following schemas must be satisfied:</p>
      <Tabs :model-value="`oneof-${selectedOneOf}`" @update:model-value="selectedOneOf = parseInt($event.replace('oneof-', ''))" class="w-full">
        <TabsList class="w-full flex-wrap h-auto">
          <TabsTrigger
            v-for="(s, idx) in resolvedSchema.oneOf"
            :key="idx"
            :value="`oneof-${idx}`"
          >
            Option {{ idx + 1 }}{{ s.title ? `: ${s.title}` : '' }}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          v-for="(s, idx) in resolvedSchema.oneOf"
          :key="idx"
          :value="`oneof-${idx}`"
        >
          <Card class="p-4">
            <SchemaContent :schema="resolver.resolve(s)" :resolver="resolver" :depth="0" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    
    <div v-else-if="resolvedSchema.anyOf" class="space-y-4">
      <p class="text-sm text-muted-foreground">Any of the following schemas can be satisfied:</p>
      <Tabs :model-value="`anyof-${selectedAnyOf}`" @update:model-value="selectedAnyOf = parseInt($event.replace('anyof-', ''))" class="w-full">
        <TabsList class="w-full flex-wrap h-auto">
          <TabsTrigger
            v-for="(s, idx) in resolvedSchema.anyOf"
            :key="idx"
            :value="`anyof-${idx}`"
          >
            Option {{ idx + 1 }}{{ s.title ? `: ${s.title}` : '' }}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          v-for="(s, idx) in resolvedSchema.anyOf"
          :key="idx"
          :value="`anyof-${idx}`"
        >
          <Card class="p-4">
            <SchemaContent :schema="resolver.resolve(s)" :resolver="resolver" :depth="0" />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    
    <SchemaContent
      v-else
      :schema="resolvedSchema"
      :resolver="resolver"
      :depth="0"
    />

    <a
      v-if="resolvedSchema.externalDocs"
      :href="resolvedSchema.externalDocs.url"
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-primary hover:underline inline-flex items-center gap-1"
    >
      📖 {{ resolvedSchema.externalDocs.description || 'External Documentation' }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Schema } from '@/types/openapi'
import { RefResolver } from '@/utils/ref-resolver'
import Card from './ui/Card.vue'
import Tabs from './ui/Tabs.vue'
import TabsList from './ui/TabsList.vue'
import TabsTrigger from './ui/TabsTrigger.vue'
import TabsContent from './ui/TabsContent.vue'
import SchemaContent from './SchemaContent.vue'

interface Props {
  schema: Schema
  title?: string
  resolver: RefResolver
}

const props = defineProps<Props>()

const selectedOneOf = ref(0)
const selectedAnyOf = ref(0)

// Update default tab when schema changes
watch(() => props.schema, () => {
  selectedOneOf.value = 0
  selectedAnyOf.value = 0
})

const resolvedSchema = computed(() => {
  return props.resolver.resolve<Schema>(props.schema)
})
</script>

