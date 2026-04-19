<script setup>
import { useRoute } from 'vue-router'
import Header from './components/layout/Header.vue'

const route = useRoute()
</script>

<template>
  <div
    class="flex min-h-screen flex-col bg-slate-50 text-slate-800 antialiased transition-colors dark:bg-slate-950 dark:text-slate-100"
  >
    <Header />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition
          mode="out-in"
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
        >
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>
  </div>
</template>
