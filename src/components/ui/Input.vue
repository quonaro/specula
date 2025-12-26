<template>
  <div class="relative">
    <!-- Hidden dummy fields to trick browser autofill -->
    <input
      v-if="type === 'password'"
      type="password"
      autocomplete="new-password"
      tabindex="-1"
      aria-hidden="true"
      style="position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none;"
      readonly
    />
    <input
      ref="inputRef"
      :type="actualType"
      :value="modelValue"
      :autocomplete="type === 'password' ? 'new-password' : undefined"
      :readonly="type === 'password' ? isReadonly : false"
      :data-form-type="type === 'password' ? 'other' : undefined"
      :data-lpignore="type === 'password' ? 'true' : undefined"
      :data-1p-ignore="type === 'password' ? 'true' : undefined"
      :data-bwignore="type === 'password' ? 'true' : undefined"
      :data-dashlane-ignore="type === 'password' ? 'true' : undefined"
      :name="type === 'password' ? 'not-a-password-field' : undefined"
      :id="type === 'password' ? `password-${Math.random().toString(36).substr(2, 9)}` : undefined"
      :class="cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )"
      @input="handleInput"
      @focus="handleFocus"
      @click="handleClick"
      @mousedown="handleMouseDown"
      v-bind="$attrs"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  type?: string
  modelValue?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
  className: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isReadonly = ref(true)
const isPasswordType = ref(false)

// Start with text type for password fields, switch to password on interaction
const actualType = computed(() => {
  if (props.type === 'password') {
    return isPasswordType.value ? 'password' : 'text'
  }
  return props.type
})

// Handle input
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  // If it's a password field that's still in text mode, switch to password
  if (props.type === 'password' && !isPasswordType.value) {
    isPasswordType.value = true
    // Update the value after type change
    setTimeout(() => {
      if (inputRef.value) {
        inputRef.value.value = target.value
      }
    }, 0)
  }
  emit('update:modelValue', target.value)
}

// Remove readonly and switch to password type on focus/click
const handleFocus = () => {
  if (props.type === 'password') {
    isReadonly.value = false
    if (!isPasswordType.value) {
      isPasswordType.value = true
      // Small delay to ensure browser doesn't trigger autofill
      setTimeout(() => {
        if (inputRef.value) {
          inputRef.value.focus()
        }
      }, 10)
    }
  }
}

const handleClick = () => {
  if (props.type === 'password') {
    isReadonly.value = false
    if (!isPasswordType.value) {
      isPasswordType.value = true
    }
  }
}

const handleMouseDown = () => {
  if (props.type === 'password') {
    isReadonly.value = false
    if (!isPasswordType.value) {
      isPasswordType.value = true
    }
  }
}

onMounted(() => {
  // Set readonly initially for password fields to prevent autofill
  if (props.type === 'password' && inputRef.value) {
    isReadonly.value = true
    isPasswordType.value = false
  }
})
</script>

