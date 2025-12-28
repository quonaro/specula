<template>
  <TryItOut 
    :method="method" 
    :path="path" 
    :operation="operation" 
    :spec="spec" 
    :path-item="pathItem"
    :source-url="sourceUrl" 
    :server-url="serverUrl"
    :authorization-credentials="authorizationCredentials" 
    @response="handleResponse" 
  />
</template>

<script setup lang="ts">
import type { Operation, OpenAPISpec, PathItem } from '@/types/openapi'
import TryItOut from '../TryItOut.vue'

interface Props {
  method: string
  path: string
  operation: Operation
  spec: OpenAPISpec
  pathItem?: PathItem
  sourceUrl?: string
  serverUrl?: string
  authorizationCredentials?: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  response: [response: any]
}>()

const handleResponse = (responseData: any) => {
  emit('response', responseData)
}
</script>


