<template>
  <Button variant="outline" size="icon" @click="toggleTheme">
    <Moon v-if="theme === 'light'" class="h-5 w-5" />
    <Sun v-else class="h-5 w-5" />
  </Button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import Button from './ui/Button.vue'

const theme = ref<'light' | 'dark'>('light')

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light')
  
  theme.value = initialTheme
  document.documentElement.classList.toggle('dark', initialTheme === 'dark')
})

const toggleTheme = () => {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  theme.value = newTheme
  localStorage.setItem('theme', newTheme)
  document.documentElement.classList.toggle('dark', newTheme === 'dark')
}
</script>

