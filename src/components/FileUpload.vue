<template>
  <div class="flex min-h-screen bg-background">
    <!-- Left Sidebar - Menu -->
    <div class="w-1/2 border-r border-border overflow-y-auto p-6">
      <div class="text-center space-y-2 mb-6">
        <div class="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="Logo" class="h-12 logo-image" />
          <h1 class="text-3xl font-bold tracking-tight">Specula</h1>
        </div>
        <p class="text-sm text-muted-foreground">
          Load your OpenAPI 3.0+ specification to explore
        </p>
      </div>

      <div class="space-y-2">
        <!-- File Upload Section -->
        <div class="border-b border-border">
          <button
            @click="toggleSection('upload')"
            class="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>Upload Files</span>
            <ChevronDown
              :class="['h-4 w-4 transition-transform', sectionsOpen.upload ? 'rotate-180' : '']"
            />
          </button>
          <div v-show="sectionsOpen.upload" class="pb-3">
            <div
              @drop="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              :class="[
                'border border-dashed rounded p-6 transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              ]"
            >
              <div class="flex flex-col items-center gap-2">
                <Upload class="h-6 w-6 text-muted-foreground" />
                <p class="text-xs text-muted-foreground text-center">Drop files or click to browse</p>
                <Button @click="fileInputRef?.click()" size="sm" variant="outline" class="mt-1">
                  Choose Files
                </Button>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".json"
                  multiple
                  class="hidden"
                  @change="handleFileChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Clipboard Section -->
        <div class="border-b border-border">
          <button
            @click="toggleSection('clipboard')"
            class="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>From Clipboard</span>
            <ChevronDown
              :class="['h-4 w-4 transition-transform', sectionsOpen.clipboard ? 'rotate-180' : '']"
            />
          </button>
          <div v-show="sectionsOpen.clipboard" class="pb-3 space-y-2">
            <Textarea
              v-model="clipboardText"
              placeholder="Paste OpenAPI JSON specification here..."
              class="font-mono text-xs min-h-32"
              @paste="handleClipboardPaste"
            />
            <Button @click="handleLoadFromClipboard" size="sm" variant="outline" class="w-full">
              Load from Clipboard
            </Button>
          </div>
        </div>

        <!-- URL Section -->
        <div class="border-b border-border">
          <button
            @click="toggleSection('url')"
            class="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>Load from URL</span>
            <ChevronDown
              :class="['h-4 w-4 transition-transform', sectionsOpen.url ? 'rotate-180' : '']"
            />
          </button>
          <div v-show="sectionsOpen.url" class="pb-3 space-y-2">
            <div class="flex gap-2">
              <Input
                v-model="urlText"
                placeholder="https://example.com/openapi.json"
                type="url"
                class="font-mono text-xs flex-1"
                @keyup.enter="handleAddUrl"
              />
              <Button @click="handleAddUrl" :disabled="isLoadingUrl" size="sm" variant="outline">
                Add
              </Button>
            </div>
            <div v-if="urlList.length > 0" class="space-y-1 max-h-48 overflow-y-auto">
              <div
                v-for="(url, index) in urlList"
                :key="index"
                class="flex items-center gap-2 p-1.5 border border-border rounded text-xs"
              >
                <input
                  type="checkbox"
                  :id="`url-${index}`"
                  v-model="selectedUrls"
                  :value="index"
                  class="rounded"
                />
                <label :for="`url-${index}`" class="flex-1 font-mono truncate cursor-pointer">
                  {{ url }}
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-4 w-4"
                  @click="removeUrl(index)"
                >
                  <X class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Favorites Section -->
        <div v-if="favoriteSpecs.length > 0" class="border-b border-border">
          <button
            @click="toggleSection('favorites')"
            class="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>Favorites ({{ favoriteSpecs.length }})</span>
            <ChevronDown
              :class="['h-4 w-4 transition-transform', sectionsOpen.favorites ? 'rotate-180' : '']"
            />
          </button>
          <div v-show="sectionsOpen.favorites" class="pb-3">
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <div
                v-for="favorite in favoriteSpecs"
                :key="favorite.hash"
                class="flex items-center gap-2 p-1.5 border border-border rounded group"
              >
                <input
                  type="checkbox"
                  :id="`favorite-${favorite.hash}`"
                  v-model="selectedFavorites"
                  :value="favorite.hash"
                  class="rounded"
                />
                <label
                  :for="`favorite-${favorite.hash}`"
                  class="flex-1 min-w-0 cursor-pointer text-xs"
                  @click.stop
                >
                  <div class="font-medium text-foreground truncate">{{ favorite.title }}</div>
                  <div class="text-muted-foreground truncate text-xs">
                    {{ favorite.hash }}
                  </div>
                </label>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="downloadSpec(favorite.spec)"
                    title="Download"
                  >
                    <Download class="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5 text-yellow-500 hover:text-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="removeFromFavorites(favorite.hash)"
                    title="Remove from favorites"
                  >
                    <Star class="h-3 w-3 fill-current" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- History Section -->
        <div v-if="specHistoryStore.history.length > 0" class="border-b border-border">
          <button
            @click="toggleSection('history')"
            class="w-full flex items-center justify-between py-3 text-sm font-medium hover:text-foreground transition-colors text-muted-foreground"
          >
            <span>History ({{ specHistoryStore.history.length }})</span>
            <ChevronDown
              :class="['h-4 w-4 transition-transform', sectionsOpen.history ? 'rotate-180' : '']"
            />
          </button>
          <div v-show="sectionsOpen.history" class="pb-3">
            <div class="space-y-1 max-h-64 overflow-y-auto">
              <!-- History items - only viewed specs -->
              <div
                v-for="item in specHistoryStore.history"
                :key="`history-${item.id}`"
                class="flex items-center gap-2 p-1.5 border border-border rounded group"
              >
                <input
                  type="checkbox"
                  :id="`history-${item.id}`"
                  v-model="selectedHistory"
                  :value="item.id"
                  class="rounded"
                />
                <label
                  :for="`history-${item.id}`"
                  class="flex-1 min-w-0 cursor-pointer text-xs"
                  @click.stop
                >
                  <div class="font-medium text-foreground truncate">{{ item.title }}</div>
                  <div class="text-muted-foreground text-xs">
                    v{{ item.version }} | OpenAPI {{ item.openapi }}
                  </div>
                </label>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="downloadSpec(item.spec)"
                    title="Download"
                  >
                    <Download class="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5 text-muted-foreground hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="addHistoryToFavorites(item.id)"
                    title="Add to favorites"
                  >
                    <Star class="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="specHistoryStore.removeFromHistory(item.id)"
                  >
                    <X class="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side - Selected Specs -->
    <div class="w-1/2 overflow-y-auto p-6">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="text-center space-y-2">
          <h2 class="text-2xl font-bold">Selected Specifications</h2>
          <p class="text-sm text-muted-foreground">
            {{ selectedCount }} specification(s) selected
          </p>
        </div>

        <!-- Selected Items List -->
        <div v-if="hasSelectedSpecs" class="space-y-3">
          <!-- Selected Favorites -->
          <div v-if="selectedFavorites.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">⭐ Favorites</div>
            <div class="space-y-2">
              <div
                v-for="hash in selectedFavorites"
                :key="hash"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">
                    {{ getFavoriteTitle(hash) }}
                  </div>
                  <div class="text-xs text-muted-foreground">Hash: {{ hash }}</div>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-primary"
                    @click.stop="downloadSpecByHash(hash)"
                    title="Download"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="removeFromSelected('favorites', hash)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Cache -->
          <div v-if="selectedCache.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">💾 Cached</div>
            <div class="space-y-2">
              <div
                v-for="hash in selectedCache"
                :key="hash"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">
                    {{ getCacheTitle(hash) }}
                  </div>
                  <div class="text-xs text-muted-foreground">Hash: {{ hash }}</div>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-primary"
                    @click.stop="downloadSpecByHash(hash)"
                    title="Download"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="removeFromSelected('cache', hash)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected History -->
          <div v-if="selectedHistory.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">🕒 Recent</div>
            <div class="space-y-2">
              <div
                v-for="id in selectedHistory"
                :key="id"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">
                    {{ getHistoryTitle(id) }}
                  </div>
                  <div class="text-xs text-muted-foreground">From history</div>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-primary"
                    @click.stop="downloadSpecById(id)"
                    title="Download"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="removeFromSelected('history', id)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected URLs -->
          <div v-if="selectedUrls.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">🔗 URLs</div>
            <div class="space-y-2">
              <div
                v-for="index in selectedUrls"
                :key="index"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-mono text-foreground truncate">
                    {{ urlList[index] }}
                  </div>
                  <div class="text-xs text-muted-foreground">URL</div>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-primary"
                    @click.stop="downloadSpecByUrl(urlList[index])"
                    title="Download"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="removeFromSelected('urls', index)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Loaded Files -->
          <div v-if="loadedFiles.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-foreground">📁 Files</div>
            <div class="space-y-2">
              <div
                v-for="(file, index) in loadedFiles"
                :key="index"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
              >
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">
                    {{ file.spec.info?.title || 'Untitled Specification' }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    v{{ file.spec.info?.version || '1.0.0' }} | OpenAPI {{ file.spec.openapi }}
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 text-muted-foreground hover:text-primary"
                    @click.stop="downloadSpec(file.spec)"
                    title="Download"
                  >
                    <Download class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click="removeLoadedFile(index)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <p class="text-muted-foreground">No specifications selected</p>
          <p class="text-sm text-muted-foreground mt-2">
            Select specifications from the left menu to load them
          </p>
        </div>

        <!-- Load Button -->
        <div v-if="hasSelectedSpecs" class="pt-4 border-t border-border">
          <Button
            @click="handleLoadAllSelected"
            :disabled="isLoadingAll"
            class="w-full"
            size="lg"
          >
            {{ isLoadingAll ? 'Loading...' : `Load All Selected (${selectedCount})` }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Upload, X, Star, ChevronDown, Download } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import Input from './ui/Input.vue'
import Textarea from './ui/Textarea.vue'
import { useToast } from '@/composables/useToast'
import { useSpecHistoryStore } from '@/stores/specHistory'
import { useSpecCacheStore } from '@/stores/specCache'
import { useSpecFavoritesStore } from '@/stores/specFavorites'
import type { OpenAPISpec } from '@/types/openapi'

interface Props {
  onSpecLoad: (spec: OpenAPISpec) => void
}

defineProps<Props>()

const route = useRoute()
const { toast } = useToast()
const specHistoryStore = useSpecHistoryStore()
const specCacheStore = useSpecCacheStore()
const specFavoritesStore = useSpecFavoritesStore()
const isDragging = ref(false)
const showUrlInput = ref(true)
const urlText = ref('')
const isLoadingUrl = ref(false)
const isLoadingAll = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Sections collapse state
const sectionsOpen = ref({
  upload: true,
  clipboard: false,
  url: true,
  favorites: true,
  history: true,
})

const clipboardText = ref('')

const toggleSection = (section: keyof typeof sectionsOpen.value) => {
  sectionsOpen.value[section] = !sectionsOpen.value[section]
}

// Multiple selection state
const selectedHistory = ref<string[]>([])
const selectedCache = ref<string[]>([])
const selectedFavorites = ref<string[]>([])
const selectedUrls = ref<number[]>([])
const urlList = ref<string[]>([])
const loadedFiles = ref<Array<{ spec: OpenAPISpec; hash?: string; sourceUrl?: string }>>([])

// Computed: separate favorites from regular cache
const favoriteSpecs = computed(() => {
  const favorites: Array<{ hash: string; spec: OpenAPISpec; title: string; timestamp: number }> = []
  specCacheStore.cache.forEach((cached, hash) => {
    if (specFavoritesStore.isFavorite(hash)) {
      favorites.push({
        hash: cached.hash,
        spec: cached.spec,
        title: cached.title,
        timestamp: cached.timestamp,
      })
    }
  })
  return favorites
})

const regularCacheSpecs = computed(() => {
  const regular: Array<{ hash: string; spec: OpenAPISpec; title: string; timestamp: number }> = []
  specCacheStore.cache.forEach((cached, hash) => {
    if (!specFavoritesStore.isFavorite(hash)) {
      regular.push({
        hash: cached.hash,
        spec: cached.spec,
        title: cached.title,
        timestamp: cached.timestamp,
      })
    }
  })
  return regular
})


// Computed properties
const selectedCount = computed(() => {
  return selectedHistory.value.length + selectedCache.value.length + selectedFavorites.value.length + selectedUrls.value.length + loadedFiles.value.length
})

const hasSelectedSpecs = computed(() => {
  return selectedCount.value > 0
})

// Helper functions to get titles
const getFavoriteTitle = (hash: string) => {
  const cached = specCacheStore.getCachedSpec(hash)
  return cached?.title || 'Unknown'
}

const getCacheTitle = (hash: string) => {
  const cached = specCacheStore.getCachedSpec(hash)
  return cached?.title || 'Unknown'
}

const getHistoryTitle = (id: string) => {
  const item = specHistoryStore.history.find(h => h.id === id)
  return item?.title || 'Unknown'
}

const removeFromSelected = (type: 'favorites' | 'cache' | 'history' | 'urls', value: string | number) => {
  if (type === 'favorites') {
    const index = selectedFavorites.value.indexOf(value as string)
    if (index !== -1) selectedFavorites.value.splice(index, 1)
  } else if (type === 'cache') {
    const index = selectedCache.value.indexOf(value as string)
    if (index !== -1) selectedCache.value.splice(index, 1)
  } else if (type === 'history') {
    const index = selectedHistory.value.indexOf(value as string)
    if (index !== -1) selectedHistory.value.splice(index, 1)
  } else if (type === 'urls') {
    const index = selectedUrls.value.indexOf(value as number)
    if (index !== -1) selectedUrls.value.splice(index, 1)
  }
}

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
      validateAndAddFile(spec, true) // Mark as from file to cache it
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

const validateAndAddFile = (spec: any, isFromFile: boolean = false) => {
  if (!spec.openapi || !spec.paths) {
    toast({
      title: 'Invalid OpenAPI spec',
      description: 'Missing required fields (openapi, paths)',
      variant: 'destructive',
    })
    return
  }

  const openApiSpec = spec as OpenAPISpec
  
  // If loaded from file, cache it and get hash
  let hash: string | undefined
  if (isFromFile) {
    hash = specCacheStore.addToCache(openApiSpec)
  }
  
  loadedFiles.value.push({
    spec: openApiSpec,
    hash,
  })

  toast({
    title: 'Added',
    description: `Added ${spec.info?.title || 'OpenAPI specification'} to selection`,
  })
}

const validateAndLoad = (spec: any, isFromFile: boolean = false, sourceUrl?: string) => {
  if (!spec.openapi || !spec.paths) {
    toast({
      title: 'Invalid OpenAPI spec',
      description: 'Missing required fields (openapi, paths)',
      variant: 'destructive',
    })
    return null
  }

  const openApiSpec = spec as OpenAPISpec
  
  // If loaded from file, cache it and get hash
  let hash: string | undefined
  if (isFromFile) {
    hash = specCacheStore.addToCache(openApiSpec)
  }
  
  return { spec: openApiSpec, hash, sourceUrl }
}

const handleAddUrl = () => {
  const url = urlText.value.trim()
  if (!url) {
    toast({
      title: 'Empty URL',
      description: 'Please enter a URL',
      variant: 'destructive',
    })
    return
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    toast({
      title: 'Invalid URL',
      description: 'Please enter a valid URL',
      variant: 'destructive',
    })
    return
  }

  if (urlList.value.includes(url)) {
    toast({
      title: 'Duplicate URL',
      description: 'This URL is already in the list',
      variant: 'destructive',
    })
    return
  }

  urlList.value.push(url)
  urlText.value = ''
  toast({
    title: 'Added',
    description: 'URL added to list',
  })
}

const removeUrl = (index: number) => {
  urlList.value.splice(index, 1)
  // Remove from selected if it was selected
  const selectedIndex = selectedUrls.value.indexOf(index)
  if (selectedIndex !== -1) {
    selectedUrls.value.splice(selectedIndex, 1)
  }
  // Update selected indices for URLs after the removed one
  selectedUrls.value = selectedUrls.value.map(i => i > index ? i - 1 : i)
}

const removeLoadedFile = (index: number) => {
  loadedFiles.value.splice(index, 1)
}

const addToFavorites = (hash: string) => {
  const cached = specCacheStore.getCachedSpec(hash)
  if (cached) {
    specFavoritesStore.addToFavorites(cached.spec, hash)
    toast({
      title: 'Added to favorites',
      description: `${cached.title} has been added to favorites`,
    })
  }
}

const removeFromFavorites = (hash: string) => {
  const cached = specCacheStore.getCachedSpec(hash)
  if (cached) {
    specFavoritesStore.removeFromFavorites(hash)
    // Remove from selected if it was selected
    const selectedIndex = selectedFavorites.value.indexOf(hash)
    if (selectedIndex !== -1) {
      selectedFavorites.value.splice(selectedIndex, 1)
    }
    toast({
      title: 'Removed from favorites',
      description: `${cached.title} has been removed from favorites`,
    })
  }
}

// Sanitize filename by removing invalid characters
const sanitizeFileName = (name: string): string => {
  // Remove invalid characters for filenames: / \ : * ? " < > |
  return name.replace(/[/\\:*?"<>|]/g, '_').trim() || 'openapi'
}

// Download a single specification
const downloadSpec = (spec: OpenAPISpec) => {
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
  
  toast({
    title: 'Downloaded',
    description: `${spec.info?.title || 'Specification'} downloaded successfully`,
  })
}

// Download spec by hash (from cache)
const downloadSpecByHash = (hash: string) => {
  const cached = specCacheStore.getCachedSpec(hash)
  if (cached) {
    downloadSpec(cached.spec)
  } else {
    toast({
      title: 'Not found',
      description: 'Specification not found in cache',
      variant: 'destructive',
    })
  }
}

// Download spec by history id
const downloadSpecById = (id: string) => {
  const spec = specHistoryStore.getSpecById(id)
  if (spec) {
    downloadSpec(spec)
  } else {
    toast({
      title: 'Not found',
      description: 'Specification not found in history',
      variant: 'destructive',
    })
  }
}

// Download spec by URL
const downloadSpecByUrl = async (url: string) => {
  try {
    isLoadingUrl.value = true
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const spec = await response.json()
    const validated = validateAndLoad(spec, false, url)
    if (validated) {
      downloadSpec(validated.spec)
    }
  } catch (error: any) {
    toast({
      title: 'Failed to download',
      description: `Could not download from ${url}: ${error.message || 'Unknown error'}`,
      variant: 'destructive',
    })
  } finally {
    isLoadingUrl.value = false
  }
}

const addHistoryToFavorites = (id: string) => {
  const spec = specHistoryStore.getSpecById(id)
  if (spec) {
    // First, try to find hash in cache
    let hash: string | undefined
    const cachedSpecs = Array.from(specCacheStore.cache.values())
    const cached = cachedSpecs.find(c => 
      JSON.stringify(c.spec) === JSON.stringify(spec)
    )
    
    if (cached) {
      hash = cached.hash
    } else {
      // If not in cache, add it first
      hash = specCacheStore.addToCache(spec)
    }
    
    // Add to favorites
    specFavoritesStore.addToFavorites(spec, hash)
    toast({
      title: 'Added to favorites',
      description: `${spec.info?.title || 'Specification'} has been added to favorites`,
    })
  }
}

const handleClipboardPaste = async (e: ClipboardEvent) => {
  const pastedText = e.clipboardData?.getData('text') || ''
  if (pastedText.trim()) {
    clipboardText.value = pastedText
  }
}

const handleLoadFromClipboard = async () => {
  let text = clipboardText.value.trim()
  
  // If textarea is empty, try to read directly from clipboard
  if (!text) {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText()
      } else {
        toast({
          title: 'Clipboard API not available',
          description: 'Please paste the JSON specification into the text field',
          variant: 'destructive',
        })
        return
      }
    } catch (error: any) {
      toast({
        title: 'Failed to read clipboard',
        description: error.message || 'Please paste the JSON specification into the text field',
        variant: 'destructive',
      })
      return
    }
  }

  if (!text) {
    toast({
      title: 'Empty clipboard',
      description: 'Please paste OpenAPI JSON specification',
      variant: 'destructive',
    })
    return
  }

  try {
    const spec = JSON.parse(text)
    validateAndAddFile(spec, true)
    clipboardText.value = ''
    toast({
      title: 'Success',
      description: 'Specification loaded from clipboard',
    })
  } catch (error) {
    toast({
      title: 'Invalid JSON',
      description: 'Could not parse JSON from clipboard. Please check the format.',
      variant: 'destructive',
    })
  }
}

const emit = defineEmits<{
  (e: 'specLoad', spec: OpenAPISpec, hash?: string): void
  (e: 'specsLoad', specs: Array<{ spec: OpenAPISpec; hash?: string; sourceUrl?: string }>): void
}>()

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  files.forEach(file => {
    if (file.name.endsWith('.json')) {
      handleFile(file)
    }
  })
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  files.forEach(file => {
    if (file.name.endsWith('.json')) {
      handleFile(file)
    }
  })
  // Reset input to allow selecting the same files again
  if (target) {
    target.value = ''
  }
}

const handleLoadAllSelected = async () => {
  if (!hasSelectedSpecs.value) {
    toast({
      title: 'No selection',
      description: 'Please select at least one specification',
      variant: 'destructive',
    })
    return
  }

  isLoadingAll.value = true
  const allSpecs: Array<{ spec: OpenAPISpec; hash?: string; sourceUrl?: string }> = []

  try {
    // Load from history
    for (const id of selectedHistory.value) {
      const spec = specHistoryStore.getSpecById(id)
      if (spec) {
        // Try to find hash in cache by comparing spec content
        let hash: string | undefined
        const cachedSpecs = Array.from(specCacheStore.cache.values())
        const cached = cachedSpecs.find(c => 
          JSON.stringify(c.spec) === JSON.stringify(spec)
        )
        
        if (cached) {
          hash = cached.hash
        } else {
          // If not in cache, add it
          hash = specCacheStore.addToCache(spec)
        }
        
        allSpecs.push({ spec, hash })
      }
    }

    // Load from favorites
    for (const hash of selectedFavorites.value) {
      const cached = specCacheStore.getCachedSpec(hash)
      if (cached) {
        allSpecs.push({ spec: cached.spec, hash: cached.hash })
      }
    }

    // Load from cache
    for (const hash of selectedCache.value) {
      const cached = specCacheStore.getCachedSpec(hash)
      if (cached) {
        allSpecs.push({ spec: cached.spec, hash: cached.hash })
      }
    }

    // Load from URLs
    for (const index of selectedUrls.value) {
      const url = urlList.value[index]
      if (url) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const spec = await response.json()
          const validated = validateAndLoad(spec, false, url)
          if (validated) {
            allSpecs.push(validated)
          }
        } catch (error: any) {
          toast({
            title: 'Failed to load URL',
            description: `Could not load from ${url}: ${error.message || 'Unknown error'}`,
            variant: 'destructive',
          })
        }
      }
    }

    // Add loaded files
    allSpecs.push(...loadedFiles.value)

    if (allSpecs.length === 0) {
      toast({
        title: 'No valid specs',
        description: 'No valid specifications were found in selection',
        variant: 'destructive',
      })
      return
    }

    // Emit all specs at once
    emit('specsLoad', allSpecs)

    // Clear selections
    selectedHistory.value = []
    selectedCache.value = []
    selectedFavorites.value = []
    selectedUrls.value = []
    loadedFiles.value = []
  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'Failed to load specifications',
      variant: 'destructive',
    })
  } finally {
    isLoadingAll.value = false
  }
}

// Check for URL parameter on mount
onMounted(async () => {
  const urlParam = route.query.url as string | undefined
  if (urlParam) {
    urlText.value = decodeURIComponent(urlParam)
    showUrlInput.value = true
    // Small delay to ensure UI is ready
    await new Promise(resolve => setTimeout(resolve, 100))
    handleAddUrl()
  }
})

</script>
