<template>
  <Button variant="outline" size="icon" @click="themeStore.toggleTheme">
    <Moon v-if="themeStore.theme === 'light'" class="h-5 w-5" />
    <Sun v-else class="h-5 w-5" />
  </Button>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import Button from './ui/Button.vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
</script>

