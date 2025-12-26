<template>
  <Dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="Settings">
    <div class="space-y-6">
      <!-- Theme Selection -->
      <div class="space-y-4">
        <label class="text-sm font-medium">Theme</label>
        
        <!-- All Themes in Scrollable Grid -->
        <div class="max-h-[500px] overflow-y-auto pr-2">
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <!-- System Theme -->
            <button
              :class="[
                'relative px-3 py-3 rounded-lg border-2 transition-all overflow-hidden group',
                themeStore.theme === 'system'
                  ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
              ]"
              @click="themeStore.setTheme('system')"
              @mouseenter="handleThemePreview('system')"
              @mouseleave="handleThemePreview(null)"
            >
              <!-- Theme Preview -->
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30"></div>
              </div>
              
              <div class="relative z-10">
                <!-- Color Preview -->
                <div class="flex gap-1 mb-2">
                  <div class="h-3 w-3 rounded-full bg-background border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-card border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-muted border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <div class="text-xs font-medium">System</div>
                <div class="text-[10px] text-muted-foreground mt-0.5">Follow system</div>
              </div>
              
              <Check 
                v-if="themeStore.theme === 'system'" 
                class="absolute top-2 right-2 h-4 w-4 text-primary" 
              />
            </button>

            <!-- Light Themes -->
            <button
              v-for="theme in lightThemes"
              :key="theme.id"
              :class="[
                'relative px-3 py-3 rounded-lg border-2 transition-all overflow-hidden group',
                themeStore.theme === theme.id
                  ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
              ]"
              @click="themeStore.setTheme(theme.id)"
              @mouseenter="handleThemePreview(theme.id)"
              @mouseleave="handleThemePreview(null)"
            >
              <!-- Theme Preview -->
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30"></div>
              </div>
              
              <div class="relative z-10">
                <!-- Color Preview -->
                <div class="flex gap-1 mb-2">
                  <div class="h-3 w-3 rounded-full bg-background border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-card border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-muted border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <div class="text-xs font-medium">{{ theme.name }}</div>
                <div class="text-[10px] text-muted-foreground mt-0.5">{{ theme.description }}</div>
              </div>
              
              <Check 
                v-if="themeStore.theme === theme.id" 
                class="absolute top-2 right-2 h-4 w-4 text-primary" 
              />
            </button>

            <!-- Dark Themes -->
            <button
              v-for="theme in darkThemes"
              :key="theme.id"
              :class="[
                'relative px-3 py-3 rounded-lg border-2 transition-all overflow-hidden group',
                themeStore.theme === theme.id
                  ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
              ]"
              @click="themeStore.setTheme(theme.id)"
              @mouseenter="handleThemePreview(theme.id)"
              @mouseleave="handleThemePreview(null)"
            >
              <!-- Theme Preview -->
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30"></div>
              </div>
              
              <div class="relative z-10">
                <!-- Color Preview -->
                <div class="flex gap-1 mb-2">
                  <div class="h-3 w-3 rounded-full bg-background border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-card border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-muted border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <div class="text-xs font-medium">{{ theme.name }}</div>
                <div class="text-[10px] text-muted-foreground mt-0.5">{{ theme.description }}</div>
              </div>
              
              <Check 
                v-if="themeStore.theme === theme.id" 
                class="absolute top-2 right-2 h-4 w-4 text-primary" 
              />
            </button>
            
            <!-- Custom themes -->
            <button
              v-for="customTheme in customThemes"
              :key="customTheme.id"
              :class="[
                'relative px-3 py-3 rounded-lg border-2 transition-all overflow-hidden group',
                themeStore.theme === `custom:${customTheme.id}`
                  ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]'
                  : 'border-border bg-background hover:border-primary/50 hover:bg-accent/50'
              ]"
              @click="themeStore.setTheme(`custom:${customTheme.id}`)"
              @mouseenter="handleThemePreview(`custom:${customTheme.id}`)"
              @mouseleave="handleThemePreview(null)"
            >
              <!-- Theme Preview -->
              <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30"></div>
              </div>
              
              <div class="relative z-10">
                <!-- Color Preview -->
                <div class="flex gap-1 mb-2">
                  <div class="h-3 w-3 rounded-full bg-background border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-card border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-muted border border-border"></div>
                  <div class="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <div class="text-xs font-medium">{{ customTheme.name }}</div>
                <div class="text-[10px] text-muted-foreground mt-0.5 truncate">Custom</div>
              </div>
              
              <Check 
                v-if="themeStore.theme === `custom:${customTheme.id}`" 
                class="absolute top-2 right-2 h-4 w-4 text-primary" 
              />
            </button>
          </div>
        </div>
      </div>

      <!-- Accent Color Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Accent Color</label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="color in accentColors"
            :key="color.name"
            :class="[
              'h-10 rounded-md border-2 transition-all',
              settingsStore.accentColor === color.name
                ? 'border-foreground scale-105'
                : 'border-border hover:border-foreground/50'
            ]"
            :style="{ backgroundColor: color.light }"
            @click="settingsStore.setAccentColor(color.name)"
            :title="color.name"
          >
            <div
              v-if="settingsStore.accentColor === color.name"
              class="h-full w-full flex items-center justify-center"
            >
              <Check class="h-5 w-5 text-white drop-shadow-lg" />
            </div>
          </button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Check } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import { useThemeStore } from '@/stores/theme'
import { useSettingsStore } from '@/stores/settings'

interface Props {
  modelValue: boolean
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const themeStore = useThemeStore()
const settingsStore = useSettingsStore()

const customThemes = computed(() => themeStore.customThemes)

// Preview timer
let previewTimer: ReturnType<typeof setTimeout> | null = null

// Light themes
const lightThemes = [
  { id: 'light', name: 'Light', description: 'Neutral gray' },
  { id: 'light-1', name: 'Warm', description: 'Cream beige' },
  { id: 'light-2', name: 'Rose', description: 'Soft pink' },
  { id: 'light-3', name: 'Sky', description: 'Cool blue' },
]

// Dark themes
const darkThemes = [
  { id: 'dark', name: 'Dark', description: 'Neutral gray' },
  { id: 'dark-1', name: 'Amber', description: 'Warm brown' },
  { id: 'dark-2', name: 'Ocean', description: 'Blue tones' },
  { id: 'dark-3', name: 'Violet', description: 'Purple tones' },
  { id: 'deepdark', name: 'Deep Dark', description: 'Pure black' },
]

// Handle theme preview on hover with delay
const handleThemePreview = (themeId: string | null) => {
  // Clear existing timer
  if (previewTimer) {
    clearTimeout(previewTimer)
    previewTimer = null
  }

  // If clearing preview, do it immediately
  if (!themeId) {
    themeStore.previewTheme(null)
    return
  }

  // Set timer for delayed preview (1 second)
  previewTimer = setTimeout(() => {
    themeStore.previewTheme(themeId)
    previewTimer = null
  }, 1000)
}

// Cleanup on unmount
onUnmounted(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
})

const accentColors = [
  { name: 'purple', light: 'hsl(262, 83%, 58%)', dark: 'hsl(262, 83%, 58%)' },
  { name: 'blue', light: 'hsl(217, 91%, 60%)', dark: 'hsl(217, 91%, 70%)' },
  { name: 'green', light: 'hsl(142, 76%, 36%)', dark: 'hsl(142, 76%, 46%)' },
  { name: 'orange', light: 'hsl(25, 95%, 53%)', dark: 'hsl(25, 95%, 63%)' },
  { name: 'red', light: 'hsl(0, 84%, 60%)', dark: 'hsl(0, 84%, 70%)' },
  { name: 'pink', light: 'hsl(330, 81%, 60%)', dark: 'hsl(330, 81%, 70%)' },
  { name: 'cyan', light: 'hsl(199, 89%, 48%)', dark: 'hsl(199, 89%, 58%)' },
  { name: 'yellow', light: 'hsl(45, 93%, 47%)', dark: 'hsl(45, 93%, 57%)' },
  { name: 'indigo', light: 'hsl(239, 84%, 67%)', dark: 'hsl(239, 84%, 77%)' },
  { name: 'teal', light: 'hsl(173, 80%, 40%)', dark: 'hsl(173, 80%, 50%)' },
]
</script>

