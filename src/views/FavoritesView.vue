<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ToolCard from '../components/tools/ToolCard.vue'
import { getTools, getUserLikedToolIds, toggleLike } from '../firebase/api.js'
import { useAuth } from '../store/auth.js'

const { currentUser } = useAuth()
const { t } = useI18n()

const loading = ref(true)
const errorMsg = ref('')
const tools = ref([])
const likedIds = ref([])
const pendingLikeToolId = ref(null)

const likedTools = computed(() => {
  const set = new Set(likedIds.value)
  return tools.value.filter((t) => set.has(t.id))
})

async function refresh() {
  loading.value = true
  errorMsg.value = ''
  try {
    const [allTools, ids] = await Promise.all([
      getTools(),
      getUserLikedToolIds(currentUser.value.uid),
    ])
    tools.value = allTools
    likedIds.value = ids
  } catch (e) {
    errorMsg.value = t('favorites.loadError')
  } finally {
    loading.value = false
  }
}

async function handleToggleLike(tool) {
  const id = tool.id
  if (pendingLikeToolId.value === id) return

  const wasLiked = likedIds.value.includes(id)
  const next = new Set(likedIds.value)
  if (wasLiked) next.delete(id)
  else next.add(id)
  likedIds.value = [...next]

  const idx = tools.value.findIndex((t) => t.id === id)
  if (idx !== -1) {
    const cur = Number(tools.value[idx].likesCount) || 0
    const delta = wasLiked ? -1 : 1
    tools.value[idx] = { ...tools.value[idx], likesCount: Math.max(0, cur + delta) }
  }

  pendingLikeToolId.value = id
  try {
    const { liked } = await toggleLike(currentUser.value.uid, id)

    if (liked !== !wasLiked) {
      const sync = new Set(likedIds.value)
      if (liked) sync.add(id)
      else sync.delete(id)
      likedIds.value = [...sync]

      if (idx !== -1) {
        const cur = Number(tools.value[idx].likesCount) || 0
        const targetDelta = liked ? 1 : -1
        tools.value[idx] = {
          ...tools.value[idx],
          likesCount: Math.max(0, cur + targetDelta),
        }
      }
    }
  } catch (e) {
    console.error(e)
    const rollback = new Set(likedIds.value)
    if (wasLiked) rollback.add(id)
    else rollback.delete(id)
    likedIds.value = [...rollback]

    if (idx !== -1) {
      const cur = Number(tools.value[idx].likesCount) || 0
      const rollbackDelta = wasLiked ? 1 : -1
      tools.value[idx] = {
        ...tools.value[idx],
        likesCount: Math.max(0, cur + rollbackDelta),
      }
    }
  } finally {
    pendingLikeToolId.value = null
  }
}

onMounted(refresh)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-8">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {{ t('favorites.title') }}
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        {{ t('favorites.subtitle') }}
      </p>
    </div>

    <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      <div
        v-for="n in 6"
        :key="n"
        class="h-56 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
      />
    </div>

    <div
      v-else-if="likedTools.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
    >
      <p class="text-lg font-medium text-slate-700 dark:text-slate-200">
        {{ t('favorites.emptyTitle') }}
      </p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {{ t('favorites.emptyText') }}
      </p>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ToolCard
        v-for="tool in likedTools"
        :key="tool.id"
        :tool="tool"
        :liked="true"
        :like-pending="pendingLikeToolId === tool.id"
        @toggle-like="handleToggleLike(tool)"
      />
    </div>
  </div>
</template>

