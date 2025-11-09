<template>
  <div class="flex min-h-screen items-center justify-center bg-background p-6">
    <div class="w-full max-w-2xl space-y-6">
      <div class="text-center space-y-2">
        <FileJson class="mx-auto h-16 w-16 text-primary" />
        <h1 class="text-4xl font-bold tracking-tight">OpenAPI Viewer</h1>
        <p class="text-muted-foreground">
          Load your OpenAPI 3.0+ specification to explore
        </p>
      </div>

      <div
        @drop="handleDrop"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        :class="[
          'border-2 border-dashed rounded-lg p-12 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        ]"
      >
        <div class="flex flex-col items-center gap-4">
          <Upload class="h-12 w-12 text-muted-foreground" />
          <div class="text-center">
            <p class="text-lg font-medium">Drop your openapi.json here</p>
            <p class="text-sm text-muted-foreground">or</p>
          </div>
          <div class="flex gap-3">
            <Button @click="fileInputRef?.click()">
              Choose File
            </Button>
            <Button variant="outline" @click="showPaste = !showPaste">
              Paste JSON
            </Button>
            <Button variant="secondary" @click="loadExample">
              Load Example
            </Button>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileChange"
          />
        </div>
      </div>

      <div v-if="showPaste" class="space-y-3 animate-in fade-in-50 duration-200">
        <Textarea
          :model-value="jsonText"
          @update:model-value="jsonText = $event"
          placeholder="Paste your OpenAPI JSON here..."
          class="min-h-[200px] font-mono text-sm"
        />
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showPaste = false">
            Cancel
          </Button>
          <Button @click="handlePaste">Load Specification</Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Upload, FileJson } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import Textarea from './ui/Textarea.vue'
import { useToast } from '@/composables/useToast'
import type { OpenAPISpec } from '@/types/openapi'

interface Props {
  onSpecLoad: (spec: OpenAPISpec) => void
}

defineProps<Props>()

const { toast } = useToast()
const isDragging = ref(false)
const showPaste = ref(false)
const jsonText = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleFile = (file: File) => {
  if (!file.name.endsWith('.json')) {
    toast({
      title: 'Invalid file',
      description: 'Please upload a JSON file',
      variant: 'destructive',
    })
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const spec = JSON.parse(e.target?.result as string)
      validateAndLoad(spec)
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Could not parse the JSON file',
        variant: 'destructive',
      })
    }
  }
  reader.readAsText(file)
}

const validateAndLoad = (spec: any) => {
  if (!spec.openapi || !spec.paths) {
    toast({
      title: 'Invalid OpenAPI spec',
      description: 'Missing required fields (openapi, paths)',
      variant: 'destructive',
    })
    return
  }

  emit('specLoad', spec as OpenAPISpec)
  toast({
    title: 'Success',
    description: `Loaded ${spec.info?.title || 'OpenAPI specification'}`,
  })
}

const emit = defineEmits<{
  (e: 'specLoad', spec: OpenAPISpec): void
}>()

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
}

const handlePaste = () => {
  try {
    const spec = JSON.parse(jsonText.value)
    validateAndLoad(spec)
    jsonText.value = ''
    showPaste.value = false
  } catch (error) {
    toast({
      title: 'Invalid JSON',
      description: 'Could not parse the pasted JSON',
      variant: 'destructive',
    })
  }
}

const loadExample = async () => {
  try {
    const response = await fetch('/example-openapi.json')
    const spec = await response.json()
    validateAndLoad(spec)
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Could not load example specification',
      variant: 'destructive',
    })
  }
}
</script>

