import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
  isGlobal?: boolean
}

export const useEnvironmentStore = defineStore('environment', () => {
  const environments = ref<Environment[]>([])
  const activeEnvironmentId = ref<string | null>(null)

  // Load environments from localStorage
  const loadEnvironments = () => {
    if (typeof localStorage === 'undefined') return
    
    try {
      const saved = localStorage.getItem('environments')
      if (saved) {
        const parsed = JSON.parse(saved)
        environments.value = Array.isArray(parsed) ? parsed : []
      }

      // Create default environment if none exist
      if (environments.value.length === 0) {
        const defaultEnv: Environment = {
          id: 'default',
          name: 'Default',
          variables: {},
          isGlobal: true,
        }
        environments.value = [defaultEnv]
      }

      // Load active environment
      const savedActive = localStorage.getItem('activeEnvironmentId')
      if (savedActive) {
        activeEnvironmentId.value = savedActive
      } else if (environments.value.length > 0) {
        activeEnvironmentId.value = environments.value[0].id
      }
    } catch (error) {
      console.error('Failed to load environments:', error)
      // Create default environment on error
      const defaultEnv: Environment = {
        id: 'default',
        name: 'Default',
        variables: {},
        isGlobal: true,
      }
      environments.value = [defaultEnv]
      activeEnvironmentId.value = 'default'
    }
  }

  // Save environments to localStorage
  const saveEnvironments = () => {
    if (typeof localStorage === 'undefined') return
    
    try {
      localStorage.setItem('environments', JSON.stringify(environments.value))
      if (activeEnvironmentId.value) {
        localStorage.setItem('activeEnvironmentId', activeEnvironmentId.value)
      }
    } catch (error) {
      console.error('Failed to save environments:', error)
    }
  }

  // Get active environment
  const activeEnvironment = computed(() => {
    if (!activeEnvironmentId.value) return null
    return environments.value.find(env => env.id === activeEnvironmentId.value) || null
  })

  // Get all variables from active environment (and global)
  const allVariables = computed(() => {
    const vars: Record<string, string> = {}
    
    // First, add global environment variables
    const globalEnv = environments.value.find(env => env.isGlobal)
    if (globalEnv) {
      Object.assign(vars, globalEnv.variables)
    }
    
    // Then, add active environment variables (overrides global)
    if (activeEnvironment.value && !activeEnvironment.value.isGlobal) {
      Object.assign(vars, activeEnvironment.value.variables)
    }
    
    return vars
  })

  // Resolve variable in string (e.g., "{{baseUrl}}/api" -> "https://api.example.com/api")
  const resolveVariable = (value: string): string => {
    if (typeof value !== 'string') return value
    
    const vars = allVariables.value
    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return vars[varName] !== undefined ? vars[varName] : match
    })
  }

  // Resolve variables in object (recursive)
  const resolveVariables = (obj: any): any => {
    if (typeof obj === 'string') {
      return resolveVariable(obj)
    } else if (Array.isArray(obj)) {
      return obj.map(item => resolveVariables(item))
    } else if (obj && typeof obj === 'object') {
      const resolved: any = {}
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = resolveVariables(value)
      }
      return resolved
    }
    return obj
  }

  // Add or update environment
  const setEnvironment = (env: Environment) => {
    const index = environments.value.findIndex(e => e.id === env.id)
    if (index > -1) {
      environments.value[index] = env
    } else {
      environments.value.push(env)
    }
    saveEnvironments()
  }

  // Remove environment
  const removeEnvironment = (id: string) => {
    const index = environments.value.findIndex(e => e.id === id)
    if (index > -1) {
      // Don't allow removing active environment if it's the last one
      if (environments.value.length === 1) {
        return false
      }
      
      environments.value.splice(index, 1)
      
      // If removed environment was active, switch to first available
      if (activeEnvironmentId.value === id) {
        activeEnvironmentId.value = environments.value.length > 0 ? environments.value[0].id : null
      }
      
      saveEnvironments()
      return true
    }
    return false
  }

  // Set active environment
  const setActiveEnvironment = (id: string | null) => {
    if (id === null || environments.value.some(env => env.id === id)) {
      activeEnvironmentId.value = id
      saveEnvironments()
    }
  }

  // Get variable value
  const getVariable = (name: string): string | undefined => {
    return allVariables.value[name]
  }

  // Set variable in active environment
  const setVariable = (name: string, value: string) => {
    if (!activeEnvironment.value) {
      // Create default environment if none exists
      const defaultEnv: Environment = {
        id: 'default',
        name: 'Default',
        variables: {},
        isGlobal: true,
      }
      environments.value.push(defaultEnv)
      activeEnvironmentId.value = 'default'
    }

    const env = activeEnvironment.value
    env.variables[name] = value
    saveEnvironments()
  }

  // Remove variable from active environment
  const removeVariable = (name: string) => {
    if (activeEnvironment.value) {
      delete activeEnvironment.value.variables[name]
      saveEnvironments()
    }
  }

  // Watch for changes and save
  watch(environments, () => {
    saveEnvironments()
  }, { deep: true })

  watch(activeEnvironmentId, () => {
    saveEnvironments()
  })

  // Initialize on store creation
  loadEnvironments()

  return {
    environments: computed(() => environments.value),
    activeEnvironment,
    activeEnvironmentId: computed(() => activeEnvironmentId.value),
    allVariables,
    resolveVariable,
    resolveVariables,
    setEnvironment,
    removeEnvironment,
    setActiveEnvironment,
    getVariable,
    setVariable,
    removeVariable,
  }
})

