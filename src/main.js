import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAuthStore } from './store/auth.js'

initAuthStore()

createApp(App).use(router).mount('#app')
