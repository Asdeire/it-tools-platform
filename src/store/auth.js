import { computed } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../firebase/config.js'
import { USER_ROLE, ensureUserProfile } from '../firebase/api.js'

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
  await signInWithPopup(auth, googleProvider)
}

export async function logout() {
  await signOut(auth)
}

