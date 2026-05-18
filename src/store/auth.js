import { computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase/config.js'
import { USER_ROLE, ensureUserProfile } from '../firebase/api.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

function shouldUseRedirectFallback(err) {
  const code = String(err?.code || '')
  const message = String(err?.message || '')

  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    message.includes('Cross-Origin-Opener-Policy') ||
    message.includes('window.closed')
  )
}

let _unsubscribe = null
let _readyResolve = null

export const authReady = new Promise((resolve) => {
  _readyResolve = resolve
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    ready: false,
    /** @type {'user' | 'moderator'} */
    role: USER_ROLE.USER,
    roleReady: true,
  }),
  getters: {
    currentUser: (state) => state.user,
    isAuthenticated: (state) => Boolean(state.user),
    isModerator: (state) =>
      Boolean(state.user) && state.roleReady && state.role === USER_ROLE.MODERATOR,
  },
  actions: {
    setUser(user) {
      this.user = user ?? null
    },
    setReady(ready) {
      this.ready = ready
    },
    setRole(role) {
      this.role = role === USER_ROLE.MODERATOR ? USER_ROLE.MODERATOR : USER_ROLE.USER
    },
    setRoleReady(ready) {
      this.roleReady = ready
    },
  },
})

export function initAuthStore() {
  if (_unsubscribe) return

  const store = useAuthStore()

  _unsubscribe = onAuthStateChanged(auth, async (user) => {
    store.setUser(user)
    if (!user) {
      store.setRole(USER_ROLE.USER)
      store.setRoleReady(true)
    } else {
      store.setRoleReady(false)
      try {
        const role = await ensureUserProfile(user.uid, user.email)
        store.setRole(role)
      } catch {
        store.setRole(USER_ROLE.USER)
      } finally {
        store.setRoleReady(true)
      }
    }
    if (!store.ready) {
      store.setReady(true)
      _readyResolve?.()
      _readyResolve = null
    }
  })
}

export const currentUser = computed(() => useAuthStore().currentUser)
export const isAuthenticated = computed(() => useAuthStore().isAuthenticated)
export const isModerator = computed(() => useAuthStore().isModerator)

export function useAuth() {
  initAuthStore()
  const store = useAuthStore()
  const { user, ready } = storeToRefs(store)

  return {
    state: { user, ready },
    currentUser,
    isAuthenticated,
    isModerator,
  }
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(auth, googleProvider)
    return { flow: 'popup' }
  } catch (err) {
    console.error('[signInWithGoogle]', err)

    if (shouldUseRedirectFallback(err)) {
      await signInWithRedirect(auth, googleProvider)
      return { flow: 'redirect' }
    }

    throw err
  }
}

export async function logout() {
  await signOut(auth)
}

