import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './index.css'
import App from './App.vue'
import { useThemeStore } from './stores/theme'

// Lazy load pages for better code splitting
const Index = () => import('./pages/Index.vue')
const Selection = () => import('./pages/Selection.vue')
const NotFound = () => import('./pages/NotFound.vue')

const pinia = createPinia()

// Get base path from environment variable, default to '/' for development
const base = import.meta.env.BASE_URL || '/';

// Handle GitHub Pages 404 redirect
// https://github.com/rafgraph/spa-github-pages
(function (l) {
  if (l.search[1] === '/') {
    var decoded = l.search.slice(1).split('&').map(function (s) {
      return s.replace(/~and~/g, '&')
    }).join('?');
    // Use base path to correctly restore the route
    var basePath = base.endsWith('/') ? base.slice(0, -1) : base;
    var newPath = basePath + '/' + decoded;
    window.history.replaceState(null, '', newPath + l.hash);
  }
}(window.location))

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

// Initialize settings (accent color) before mounting
import { useSettingsStore } from './stores/settings'
const settingsStore = useSettingsStore()

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

