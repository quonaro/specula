<template>
  <Dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Export Specifications"
    :close-on-backdrop="false"
  >
    <div class="space-y-4">
      <p class="text-sm text-muted-foreground">
        Select the specifications and export format. Export to Postman Collection or Insomnia Collection, or download original OpenAPI specifications.
      </p>

      <!-- Export Format Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Export Format</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="format in exportFormats"
            :key="format.value"
            @click="selectedFormat = format.value"
            :class="[
              'p-3 border rounded-lg text-left transition-colors',
              selectedFormat === format.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:bg-accent/50'
            ]"
          >
            <div class="font-medium text-sm text-foreground">{{ format.label }}</div>
            <div class="text-xs text-muted-foreground mt-1">{{ format.description }}</div>
          </button>
        </div>
      </div>
      
      <!-- Specification Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium text-foreground">Specifications</label>
        <div class="space-y-2 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
          <label
            v-for="(specWithSource, index) in specs"
            :key="index"
            class="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              :checked="selectedSpecs.includes(index)"
              @change="handleToggle(index)"
              class="mt-1 rounded"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-foreground">
                {{ specWithSource.spec.info?.title || 'Untitled Specification' }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5">
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
              <div v-if="specWithSource.sourceUrl" class="text-xs text-muted-foreground mt-0.5 truncate">
                {{ specWithSource.sourceUrl }}
              </div>
            </div>
          </label>
        </div>
        
        <div class="flex items-center justify-between pt-1">
          <div class="text-xs text-muted-foreground">
            <button
              @click="selectAll"
              class="text-primary hover:underline mr-3"
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
          <div class="text-xs font-medium text-foreground">
            {{ selectedSpecs.length }} selected
          </div>
        </div>
      </div>

      <!-- Note for Postman/Insomnia export -->
      <div v-if="selectedFormat === 'postman' || selectedFormat === 'insomnia'" class="text-xs text-muted-foreground bg-muted p-2 rounded">
        <p>
          <strong>Note:</strong> When exporting to {{ selectedFormat === 'postman' ? 'Postman' : 'Insomnia' }}, 
          multiple specifications will be combined into a single collection. Authorization credentials will be included if configured.
        </p>
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
          :disabled="selectedSpecs.length === 0 || isExporting"
          @click="handleExport"
        >
          <template v-if="isExporting">
            Exporting...
          </template>
          <template v-else>
            Export
          </template>
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
import { convertToPostmanCollection } from '@/utils/export-postman'
import { convertToInsomniaCollection } from '@/utils/export-insomnia'
import { useAuthorizationStore } from '@/stores/authorization'
import { useToast } from '@/composables/useToast'
import JSZip from 'jszip'

interface Props {
  modelValue: boolean
  specs: SpecWithSource[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { toast } = useToast()
const authorizationStore = useAuthorizationStore()

type ExportFormat = 'openapi' | 'postman' | 'insomnia'

const exportFormats = [
  {
    value: 'openapi' as ExportFormat,
    label: 'OpenAPI',
    description: 'Original specification',
  },
  {
    value: 'postman' as ExportFormat,
    label: 'Postman',
    description: 'Postman Collection v2.1',
  },
  {
    value: 'insomnia' as ExportFormat,
    label: 'Insomnia',
    description: 'Insomnia Collection v4',
  },
]

const selectedFormat = ref<ExportFormat>('openapi')
const selectedSpecs = ref<number[]>([])
const isExporting = ref(false)

// Select all by default when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    selectedSpecs.value = props.specs.map((_, index) => index)
    selectedFormat.value = 'openapi'
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
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'export'
}

const handleExport = async () => {
  if (selectedSpecs.value.length === 0) return

  isExporting.value = true

  try {
    const specsToExport = selectedSpecs.value.map(index => props.specs[index])

    if (selectedFormat.value === 'openapi') {
      // Original OpenAPI export (same as DownloadDialog logic)
      await exportOpenAPI(specsToExport)
    } else if (selectedFormat.value === 'postman') {
      // Postman Collection export
      await exportPostman(specsToExport)
    } else if (selectedFormat.value === 'insomnia') {
      // Insomnia Collection export
      await exportInsomnia(specsToExport)
    }

    toast({
      title: 'Export Successful',
      description: `Successfully exported ${specsToExport.length} specification(s) as ${exportFormats.find(f => f.value === selectedFormat.value)?.label}`,
    })

    emit('update:modelValue', false)
  } catch (error: any) {
    console.error('Export error:', error)
    toast({
      title: 'Export Failed',
      description: error.message || 'Failed to export specifications',
      variant: 'destructive',
    })
  } finally {
    isExporting.value = false
  }
}

const exportOpenAPI = async (specsToExport: SpecWithSource[]) => {
  if (specsToExport.length === 1) {
    // Single spec - download as JSON file
    const spec = specsToExport[0].spec
    const fileName = sanitizeFileName(spec.info?.title || 'openapi')
    const blob = new Blob([JSON.stringify(spec, null, 2)], {
      type: 'application/json',
    })
    downloadBlob(blob, `${fileName}.json`)
  } else {
    // Multiple specs - download as ZIP archive
    const zip = new JSZip()
    const usedFileNames = new Set<string>()
    
    for (const specWithSource of specsToExport) {
      const spec = specWithSource.spec
      let fileName = sanitizeFileName(spec.info?.title || 'openapi')
      
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
    
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'openapi-specs.zip')
  }
}

const exportPostman = async (specsToExport: SpecWithSource[]) => {
  if (specsToExport.length === 0) return

  // For Postman, we'll create a single collection combining all specs
  // Or create separate collections if multiple specs
  if (specsToExport.length === 1) {
    // Single spec - export as Postman Collection
    const specWithSource = specsToExport[0]
    const credentials = authorizationStore.getCredentials(specWithSource.spec, specWithSource.sourceUrl)
    const collection = convertToPostmanCollection(specWithSource.spec, credentials)
    
    const fileName = sanitizeFileName(specWithSource.spec.info?.title || 'collection')
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/json',
    })
    downloadBlob(blob, `${fileName}.postman_collection.json`)
  } else {
    // Multiple specs - combine into single collection or create ZIP with multiple collections
    // For simplicity, we'll combine all into one collection with top-level folders
    const zip = new JSZip()
    
    for (const specWithSource of specsToExport) {
      const credentials = authorizationStore.getCredentials(specWithSource.spec, specWithSource.sourceUrl)
      const collection = convertToPostmanCollection(specWithSource.spec, credentials)
      
      const fileName = sanitizeFileName(specWithSource.spec.info?.title || 'collection')
      const jsonContent = JSON.stringify(collection, null, 2)
      zip.file(`${fileName}.postman_collection.json`, jsonContent)
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'postman-collections.zip')
  }
}

const exportInsomnia = async (specsToExport: SpecWithSource[]) => {
  if (specsToExport.length === 0) return

  if (specsToExport.length === 1) {
    // Single spec - export as Insomnia Collection
    const specWithSource = specsToExport[0]
    const credentials = authorizationStore.getCredentials(specWithSource.spec, specWithSource.sourceUrl)
    const collection = convertToInsomniaCollection(specWithSource.spec, credentials)
    
    const fileName = sanitizeFileName(specWithSource.spec.info?.title || 'collection')
    const blob = new Blob([JSON.stringify(collection, null, 2)], {
      type: 'application/json',
    })
    downloadBlob(blob, `${fileName}.insomnia.json`)
  } else {
    // Multiple specs - create ZIP with multiple collections
    const zip = new JSZip()
    
    for (const specWithSource of specsToExport) {
      const credentials = authorizationStore.getCredentials(specWithSource.spec, specWithSource.sourceUrl)
      const collection = convertToInsomniaCollection(specWithSource.spec, credentials)
      
      const fileName = sanitizeFileName(specWithSource.spec.info?.title || 'collection')
      const jsonContent = JSON.stringify(collection, null, 2)
      zip.file(`${fileName}.insomnia.json`, jsonContent)
    }
    
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'insomnia-collections.zip')
  }
}

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>


