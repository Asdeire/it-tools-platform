<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase/config.js'
import AppButton from '../components/layout/AppButton.vue'
import { useAuth } from '../store/auth.js'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { isAuthenticated } = useAuth()
const { t } = useI18n()

const mode = ref('login') // 'login' | 'register'
const email = ref('')
const password = ref('')
const busy = ref(false)
const errorMsg = ref('')

const title = computed(() =>
  mode.value === 'login' ? t('auth.welcomeBack') : t('auth.createAccount'),
)

const subtitle = computed(() =>
  mode.value === 'login'
    ? t('auth.loginSubtitle')
    : t('auth.registerSubtitle'),
)

const submitLabel = computed(() =>
  mode.value === 'login' ? t('auth.login') : t('auth.register'),
)

function toggleMode(nextMode) {
  mode.value = nextMode
  errorMsg.value = ''
}

async function onSubmit() {
  if (busy.value) return
  errorMsg.value = ''
  busy.value = true

  try {
    if (mode.value === 'login') {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    await router.replace(redirect)
  } catch (e) {
    const code = String(e?.code || '')
    if (code.includes('auth/invalid-email')) errorMsg.value = t('auth.errors.invalidEmail')
    else if (code.includes('auth/missing-password')) errorMsg.value = t('auth.errors.missingPassword')
    else if (code.includes('auth/weak-password')) errorMsg.value = t('auth.errors.weakPassword')
    else if (code.includes('auth/email-already-in-use')) errorMsg.value = t('auth.errors.emailInUse')
    else if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) errorMsg.value = t('auth.errors.invalidCredentials')
    else errorMsg.value = t('auth.errors.failed')
  } finally {
    busy.value = false
  }
}

if (isAuthenticated.value) {
  router.replace('/home')
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-md">
      <div
        class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900/40 dark:ring-white/5"
      >
        <div class="p-6 sm:p-8">
          <div class="mb-6">
            <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {{ title }}
            </h1>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {{ subtitle }}
            </p>
          </div>

          <div class="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/70">
            <button
              type="button"
              class="rounded-xl px-3 py-2 text-sm font-semibold transition"
              :class="
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              "
              @click="toggleMode('login')"
            >
              {{ t('auth.login') }}
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-2 text-sm font-semibold transition"
              :class="
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              "
              @click="toggleMode('register')"
            >
              {{ t('auth.register') }}
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="onSubmit">
            <div>
              <label for="email" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('auth.email') }}
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                required
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                :placeholder="t('auth.emailPlaceholder')"
              />
            </div>

            <div>
              <label for="password" class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('auth.password') }}
              </label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                minlength="6"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                :placeholder="t('auth.passwordPlaceholder')"
              />
            </div>

            <div v-if="errorMsg" class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {{ errorMsg }}
            </div>

            <AppButton block :disabled="busy" type="submit" variant="primary" size="lg">
              <span v-if="busy">{{ t('auth.pleaseWait') }}</span>
              <span v-else>{{ submitLabel }}</span>
            </AppButton>

            <p class="text-center text-xs text-slate-500 dark:text-slate-400">
              {{ t('auth.agreement') }}
            </p>
          </form>
        </div>
      </div>

      <div class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <RouterLink to="/home" class="font-medium text-sky-700 hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200">
          {{ t('common.backToHome') }}
        </RouterLink>
      </div>
    </div>
  </div>
</template>

