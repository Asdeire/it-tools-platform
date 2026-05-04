import { computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase/config.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

let _unsubscribe = null
let _readyResolve = null

export const authReady = new Promise((resolve) => {
  _readyResolve = resolve
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
  }),
  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    setUser(user) {
      this.user = user ?? null
    },
    setReady(ready) {
      this.ready = ready
    },
  },
})

export function initAuthStore() {
  if (_unsubscribe) return

  const store = useAuthStore()

  _unsubscribe = onAuthStateChanged(auth, (user) => {
    store.setUser(user)
    if (!store.ready) {
      store.setReady(true)
      _readyResolve?.()
      _readyResolve = null
    }
  })
}

export const currentUser = computed(() => useAuthStore().currentUser)
export const isAuthenticated = computed(() => useAuthStore().isAuthenticated)

export function useAuth() {
  initAuthStore()
  const store = useAuthStore()
  const { user, ready } = storeToRefs(store)

  return {
    state: { user, ready },
    currentUser,
    isAuthenticated,
  }
}

export async function signInWithGoogle() {
  await signInWithPopup(auth, googleProvider)
}

export async function logout() {
  await signOut(auth)
}

