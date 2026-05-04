<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '../firebase/config.js'
import AppButton from '../components/layout/AppButton.vue'
import { signInWithGoogle, useAuth } from '../store/auth.js'
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

function mapAuthError(code) {
  if (code.includes('auth/invalid-email')) return t('auth.errors.invalidEmail')
  if (code.includes('auth/missing-password')) return t('auth.errors.missingPassword')
  if (code.includes('auth/weak-password')) return t('auth.errors.weakPassword')
  if (code.includes('auth/email-already-in-use')) return t('auth.errors.emailInUse')
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
    return t('auth.errors.invalidCredentials')
  }
  if (code.includes('auth/popup-closed-by-user') || code.includes('auth/cancelled-popup-request')) {
    return t('auth.errors.popupClosed')
  }
  if (code.includes('auth/popup-blocked')) return t('auth.errors.popupBlocked')
  if (code.includes('auth/account-exists-with-different-credential')) {
    return t('auth.errors.accountExistsDifferent')
  }
  if (code.includes('auth/operation-not-allowed')) return t('auth.errors.providerDisabled')
  return t('auth.errors.failed')
}

async function afterAuthSuccess() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
  await router.replace(redirect)
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

    await afterAuthSuccess()
  } catch (e) {
    errorMsg.value = mapAuthError(String(e?.code || ''))
  } finally {
    busy.value = false
  }
}

async function onGoogleSignIn() {
  if (busy.value) return
  errorMsg.value = ''
  busy.value = true

  try {
    await signInWithGoogle()
    await afterAuthSuccess()
  } catch (e) {
    errorMsg.value = mapAuthError(String(e?.code || ''))
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

          <div class="mb-6 space-y-4">
            <AppButton
              block
              :disabled="busy"
              type="button"
              variant="outline"
              size="lg"
              class="gap-2"
              @click="onGoogleSignIn"
            >
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{{ t('auth.continueWithGoogle') }}</span>
            </AppButton>

            <div class="relative">
              <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div class="relative flex justify-center text-xs font-medium uppercase tracking-wide">
                <span class="bg-white px-3 text-slate-500 dark:bg-slate-900/40 dark:text-slate-400">
                  {{ t('auth.orEmail') }}
                </span>
              </div>
            </div>
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

