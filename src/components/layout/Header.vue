<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from './AppButton.vue'
import { logout, useAuth } from '../../store/auth.js'
import { setLocale } from '../../i18n/index.js'

const { currentUser, isAuthenticated } = useAuth()
const { t, locale } = useI18n()

async function onLogout() {
  await logout()
}

function onLocaleChange(event) {
  const next = String(event?.target?.value || '')
  setLocale(next)
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <RouterLink to="/home" class="group flex items-center gap-2 text-slate-900 no-underline dark:text-white">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition group-hover:shadow-lg group-hover:shadow-sky-500/30">
          IT
        </span>
        <span class="text-sm font-semibold tracking-tight sm:text-base">
          Tools Platform
        </span>
      </RouterLink>

      <nav class="flex items-center gap-1 sm:gap-2" :aria-label="t('app.navAria')">
        <label class="sr-only" for="locale-switch">{{ t('common.language') }}</label>

        <RouterLink to="/home"
          class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
          {{ t('nav.home') }}
        </RouterLink>

        <template v-if="isAuthenticated">
          <RouterLink to="/my-tools"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
            {{ t('nav.myTools') }}
          </RouterLink>
          <RouterLink to="/favorites"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
            {{ t('nav.favorites') }}
          </RouterLink>

          <div class="hidden items-center gap-2 sm:flex">
            <span class="max-w-[14rem] truncate text-xs font-medium text-slate-500 dark:text-slate-400"
              :title="currentUser?.email || ''">
              {{ currentUser?.displayName || currentUser?.email }}
            </span>
            <AppButton variant="outline" size="sm" @click="onLogout">
              {{ t('nav.logout') }}
            </AppButton>
          </div>
          <AppButton class="sm:hidden" variant="outline" size="sm" @click="onLogout">
            {{ t('nav.logout') }}
          </AppButton>
        </template>

        <template v-else>
          <RouterLink to="/auth"
            class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 no-underline transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            active-class="bg-slate-100 text-sky-700 dark:bg-slate-800 dark:text-sky-300">
            {{ t('nav.login') }}
          </RouterLink>
        </template>
        <select id="locale-switch" :value="locale"
          class="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500"
          :aria-label="t('app.langAria')" @change="onLocaleChange">
          <option value="en">{{ t('app.languageShort.en') }}</option>
          <option value="uk">{{ t('app.languageShort.uk') }}</option>
        </select>
      </nav>
    </div>
  </header>
</template>
