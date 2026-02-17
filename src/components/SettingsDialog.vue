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
                  : 'border-border bg-background hover:border-primary/50'
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
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors('system').background,
                      borderColor: getThemeColors('system').border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors('system').card,
                      borderColor: getThemeColors('system').border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors('system').muted,
                      borderColor: getThemeColors('system').border
                    }"
                  ></div>
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
                  : 'border-border bg-background hover:border-primary/50'
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
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).background,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).card,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).muted,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
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
                  : 'border-border bg-background hover:border-primary/50'
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
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).background,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).card,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(theme.id).muted,
                      borderColor: getThemeColors(theme.id).border
                    }"
                  ></div>
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
                  : 'border-border bg-background hover:border-primary/50'
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
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(`custom:${customTheme.id}`).background,
                      borderColor: getThemeColors(`custom:${customTheme.id}`).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(`custom:${customTheme.id}`).card,
                      borderColor: getThemeColors(`custom:${customTheme.id}`).border
                    }"
                  ></div>
                  <div 
                    class="h-3 w-3 rounded-full border" 
                    :style="{ 
                      backgroundColor: getThemeColors(`custom:${customTheme.id}`).muted,
                      borderColor: getThemeColors(`custom:${customTheme.id}`).border
                    }"
                  ></div>
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

    <!-- History Cleaning Section -->
    <div class="space-y-4 pt-6 mt-6 border-t">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <label class="text-sm font-medium">Auto-clear history</label>
          <p class="text-[12px] text-muted-foreground">Automatically delete old request history</p>
        </div>
        <Checkbox v-model="settingsStore.autoClearHistory" />
      </div>

      <div v-if="settingsStore.autoClearHistory" class="space-y-2 animate-in slide-in-from-top-2 duration-200">
        <label class="text-sm font-medium">Clear items older than</label>
        <Select v-model="settingsStore.clearHistoryInterval">
          <option value="1m">1 minute</option>
          <option value="5m">5 minutes</option>
          <option value="10m">10 minutes</option>
          <option value="30m">30 minutes</option>
          <option value="1h">1 hour</option>
          <option value="12h">12 hours</option>
          <option value="1d">1 day</option>
          <option value="1w">1 week</option>
        </Select>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue'
import { Sun, Moon, Monitor, Check } from 'lucide-vue-next'
import Dialog from './ui/Dialog.vue'
import Checkbox from './ui/Checkbox.vue'
import Select from './ui/Select.vue'
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

  // Set timer for delayed preview (300ms)
  previewTimer = setTimeout(() => {
    themeStore.previewTheme(themeId)
    previewTimer = null
  }, 300)
}

// Cleanup on unmount
onUnmounted(() => {
  if (previewTimer) {
    clearTimeout(previewTimer)
  }
})

// Get theme colors for preview circles
const getThemeColors = (themeId: string) => {
  const colors: Record<string, { background: string; card: string; muted: string; primary: string; border: string }> = {
    'system': {
      background: 'hsl(0, 0%, 100%)',
      card: 'hsl(0, 0%, 100%)',
      muted: 'hsl(220, 13%, 95%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(220, 13%, 91%)',
    },
    'light': {
      background: 'hsl(0, 0%, 100%)',
      card: 'hsl(0, 0%, 100%)',
      muted: 'hsl(220, 13%, 95%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(220, 13%, 91%)',
    },
    'light-1': {
      background: 'hsl(40, 20%, 98%)',
      card: 'hsl(40, 15%, 100%)',
      muted: 'hsl(40, 18%, 94%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(40, 15%, 88%)',
    },
    'light-2': {
      background: 'hsl(340, 25%, 98%)',
      card: 'hsl(340, 20%, 100%)',
      muted: 'hsl(340, 22%, 94%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(340, 20%, 90%)',
    },
    'light-3': {
      background: 'hsl(210, 30%, 98%)',
      card: 'hsl(210, 25%, 100%)',
      muted: 'hsl(210, 28%, 94%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(210, 25%, 88%)',
    },
    'dark': {
      background: 'hsl(220, 26%, 14%)',
      card: 'hsl(220, 24%, 18%)',
      muted: 'hsl(220, 17%, 24%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(220, 17%, 24%)',
    },
    'dark-1': {
      background: 'hsl(30, 20%, 12%)',
      card: 'hsl(30, 18%, 16%)',
      muted: 'hsl(30, 15%, 22%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(30, 15%, 22%)',
    },
    'dark-2': {
      background: 'hsl(220, 30%, 12%)',
      card: 'hsl(220, 28%, 16%)',
      muted: 'hsl(220, 25%, 22%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(220, 25%, 22%)',
    },
    'dark-3': {
      background: 'hsl(270, 25%, 11%)',
      card: 'hsl(270, 23%, 15%)',
      muted: 'hsl(270, 20%, 20%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(270, 20%, 20%)',
    },
    'deepdark': {
      background: 'hsl(0, 0%, 2%)',
      card: 'hsl(0, 0%, 5%)',
      muted: 'hsl(0, 0%, 8%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(0, 0%, 12%)',
    },
  }
  
  // For custom themes, try to get colors from CSS variables or use defaults
  if (themeId.startsWith('custom:')) {
    // Try to get colors from computed styles if theme is loaded
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      try {
        const bg = computedStyle.getPropertyValue('--background').trim()
        const card = computedStyle.getPropertyValue('--card').trim()
        const muted = computedStyle.getPropertyValue('--muted').trim()
        const primary = computedStyle.getPropertyValue('--primary').trim()
        const border = computedStyle.getPropertyValue('--border').trim()
        
        if (bg && card && muted && primary && border) {
          return {
            background: `hsl(${bg})`,
            card: `hsl(${card})`,
            muted: `hsl(${muted})`,
            primary: `hsl(${primary})`,
            border: `hsl(${border})`,
          }
        }
      } catch (e) {
        // Fall through to default
      }
    }
    // Default colors for custom themes
    return {
      background: 'hsl(0, 0%, 100%)',
      card: 'hsl(0, 0%, 100%)',
      muted: 'hsl(220, 13%, 95%)',
      primary: 'hsl(262, 83%, 58%)',
      border: 'hsl(220, 13%, 91%)',
    }
  }
  
  return colors[themeId] || colors['light']
}

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

