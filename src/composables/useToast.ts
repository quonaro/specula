import { useToast as useVueToast } from 'vue-toastification'

export function useToast() {
  const toast = useVueToast()
  
  return {
    toast: (options: { title?: string; description?: string; variant?: 'default' | 'destructive' }) => {
      const type = options.variant === 'destructive' ? 'error' : 'success'
      const content = options.title 
        ? `${options.title}${options.description ? ': ' + options.description : ''}`
        : options.description || ''
      
      toast(content, { type })
    },
  }
}

