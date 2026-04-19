<script setup>
import { RouterLink } from 'vue-router'
import AppButton from './AppButton.vue'
import { logout, useAuth } from '../../store/auth.js'

const { currentUser, isAuthenticated } = useAuth()

async function onLogout() {
  await logout()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80"
  >
    <div
      class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
    >
      <RouterLink
        to="/home"
        class="group flex items-center gap-2 text-slate-900 no-underline dark:text-white"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition group-hover:shadow-lg group-hover:shadow-sky-500/30"
        >
          IT
        </span>
        <span class="text-sm font-semibold tracking-tight sm:text-base">
          Tools Platform
        </span>
      </RouterLink>

      <nav class="flex items-center gap-1 sm:gap-2" aria-label="Main">
        <RouterLink
          to="/home"
          class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300"
        >
          Home
        </RouterLink>

        <template v-if="isAuthenticated">
          <RouterLink
            to="/my-tools"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300"
          >
            My Tools
          </RouterLink>
          <RouterLink
            to="/favorites"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300"
          >
            Favorites
          </RouterLink>

          <div class="hidden items-center gap-2 sm:flex">
            <span
              class="max-w-[14rem] truncate text-xs font-medium text-slate-500 dark:text-slate-400"
              :title="currentUser?.email || ''"
            >
              {{ currentUser?.email }}
            </span>
            <AppButton variant="outline" size="sm" @click="onLogout">
              Logout
            </AppButton>
          </div>
          <AppButton
            class="sm:hidden"
            variant="outline"
            size="sm"
            @click="onLogout"
          >
            Logout
          </AppButton>
        </template>

        <template v-else>
          <RouterLink
            to="/auth"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300"
          >
            Login
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>
