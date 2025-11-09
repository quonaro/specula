<template>
  <Dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Download Specifications"
    :close-on-backdrop="false"
  >
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Select the specifications you want to download. If you select one, it will be downloaded as a single file. If you select multiple, they will be downloaded as a ZIP archive.
      </p>
      
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <label
          v-for="(specWithSource, index) in specs"
          :key="index"
          class="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            :checked="selectedSpecs.includes(index)"
            @change="handleToggle(index)"
            class="mt-1 rounded"
          />
          <div class="flex-1 min-w-0">
            <div class="font-medium text-foreground">
              {{ specWithSource.spec.info?.title || 'Untitled Specification' }}
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              <span v-if="specWithSource.spec.info?.version">
                Version: {{ specWithSource.spec.info.version }}
              </span>
              <span v-if="specWithSource.spec.info?.version && specWithSource.spec.openapi">
                • 
              </span>
              <span v-if="specWithSource.spec.openapi">
                OpenAPI {{ specWithSource.spec.openapi }}
              </span>
            </div>
            <div v-if="specWithSource.sourceUrl" class="text-xs text-muted-foreground mt-1 truncate">
              {{ specWithSource.sourceUrl }}
            </div>
          </div>
        </label>
      </div>
      
      <div class="flex items-center justify-between pt-2 border-t border-border">
        <div class="text-sm text-muted-foreground">
          <button
            @click="selectAll"
            class="text-primary hover:underline mr-4"
          >
            Select All
          </button>
          <button
            @click="deselectAll"
            class="text-primary hover:underline"
          >
            Deselect All
          </button>
        </div>
        <div class="text-sm font-medium text-foreground">
          {{ selectedSpecs.length }} selected
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="outline"
          @click="handleCancel"
        >
          Cancel
        </Button>
        <Button
          :disabled="selectedSpecs.length === 0"
          @click="handleDownload"
        >
          Download
        </Button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from '@/components/ui/Dialog.vue'
import Button from '@/components/ui/Button.vue'
import type { SpecWithSource } from '@/stores/spec'
import JSZip from 'jszip'

interface Props {
  modelValue: boolean
  specs: SpecWithSource[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const selectedSpecs = ref<number[]>([])

// Select all by default when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedSpecs.value = props.specs.map((_, index) => index)
  }
})

const handleToggle = (index: number) => {
  const idx = selectedSpecs.value.indexOf(index)
  if (idx > -1) {
    selectedSpecs.value.splice(idx, 1)
  } else {
    selectedSpecs.value.push(index)
  }
}

const selectAll = () => {
  selectedSpecs.value = props.specs.map((_, index) => index)
}

const deselectAll = () => {
  selectedSpecs.value = []
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

// Sanitize filename by removing invalid characters
const sanitizeFileName = (name: string): string => {
  // Remove invalid characters for filenames: / \ : * ? " < > |
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'openapi'
}

const handleDownload = async () => {
  if (selectedSpecs.value.length === 0) return

  const specsToDownload = selectedSpecs.value.map(index => props.specs[index])

  if (specsToDownload.length === 1) {
    // Single spec - download as JSON file
    const spec = specsToDownload[0].spec
    const fileName = sanitizeFileName(spec.info?.title || 'openapi')
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } else {
    // Multiple specs - download as ZIP archive
    const zip = new JSZip()
    const usedFileNames = new Set<string>()
    
    for (const specWithSource of specsToDownload) {
      const spec = specWithSource.spec
      let fileName = sanitizeFileName(spec.info?.title || 'openapi')
      
      // Handle duplicate filenames by adding a number suffix
      let finalFileName = `${fileName}.json`
      let counter = 1
      while (usedFileNames.has(finalFileName)) {
        finalFileName = `${fileName}_${counter}.json`
        counter++
      }
      usedFileNames.add(finalFileName)
      
      const jsonContent = JSON.stringify(spec, null, 2)
      zip.file(finalFileName, jsonContent)
    }
    
    try {
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'openapi-specs.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error creating ZIP archive:', error)
      return
    }
  }

  emit('update:modelValue', false)
}
</script>

