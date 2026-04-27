import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { initAuthStore } from './store/auth.js'
import { i18n } from './i18n/index.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(i18n)
initAuthStore()
app.use(router)
app.mount('#app')
