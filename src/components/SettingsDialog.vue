<template>
  <Dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" title="Settings">
    <div class="space-y-6">
      <!-- Theme Selection -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Theme</label>
        <div class="flex gap-2">
          <button
            v-for="themeOption in themeOptions"
            :key="themeOption.value"
            :class="[
              'flex-1 px-4 py-2 rounded-md border transition-colors',
              themeStore.theme === themeOption.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-accent'
            ]"
            @click="themeStore.setTheme(themeOption.value)"
          >
            <component :is="themeOption.icon" class="h-4 w-4 mx-auto mb-1" />
            <span class="text-xs">{{ themeOption.label }}</span>
          </button>
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

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

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

