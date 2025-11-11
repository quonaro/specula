import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './index.css'
import App from './App.vue'
import Index from './pages/Index.vue'
import Selection from './pages/Selection.vue'
import NotFound from './pages/NotFound.vue'
import { useThemeStore } from './stores/theme'

const pinia = createPinia()

// Get base path from environment variable, default to '/' for development
const base = import.meta.env.BASE_URL || '/';

const router = createRouter({
  history: createWebHistory(base),
  routes: [
    { path: '/selection', component: Selection },
    { path: '/', component: Index },
    { path: '/group/:groupPath', component: Index },
    { path: '/spec/:specId/endpoint/:method/:path(.*)', component: Index },
    { path: '/endpoint/:method/:path(.*)', component: Index },
    // Catch-all route - Index will handle custom paths like /example.com/user/get/users
    { path: '/:pathMatch(.*)*', component: Index }
  ]
})

const app = createApp(App)
app.use(pinia)
app.use(router)

// Initialize theme before mounting to avoid flash
const themeStore = useThemeStore()
themeStore.initTheme()

app.use(Toast, {
  position: 'top-right',
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  pauseOnHover: false,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: 'button',
  icon: true,
  rtl: false
})

app.mount('#app')

