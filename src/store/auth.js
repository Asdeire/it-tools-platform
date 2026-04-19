import { computed, reactive, readonly } from 'vue'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebase/config.js'

const state = reactive({
  user: null,
  ready: false,
})

let _unsubscribe = null
let _readyResolve = null

export const authReady = new Promise((resolve) => {
  _readyResolve = resolve
})

export function initAuthStore() {
  if (_unsubscribe) return

  _unsubscribe = onAuthStateChanged(auth, (user) => {
    state.user = user ?? null
    if (!state.ready) {
      state.ready = true
      _readyResolve?.()
      _readyResolve = null
    }
  })
}

export const currentUser = computed(() => state.user)
export const isAuthenticated = computed(() => Boolean(state.user))

export function useAuth() {
  initAuthStore()
  return {
    state: readonly(state),
    currentUser,
    isAuthenticated,
  }
}

export async function logout() {
  await signOut(auth)
}

