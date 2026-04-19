const STORAGE_KEY = 'it-tools-guest-user-id'

/**
 * Persistent id for API calls (e.g. toggleLike) when Firebase Auth is not used.
 * @returns {string}
 */
export function getGuestUserId() {
  try {
    let id = localStorage.getItem(STORAGE_KEY)
    if (!id) {
      id = `guest_${crypto.randomUUID()}`
      localStorage.setItem(STORAGE_KEY, id)
    }
    return id
  } catch {
    return `guest_ephemeral_${Math.random().toString(36).slice(2)}`
  }
}
