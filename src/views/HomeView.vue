<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '../components/layout/AppButton.vue'
import ToolCard from '../components/tools/ToolCard.vue'
import { getTools, getUserLikedToolIds, toggleLike } from '../firebase/api.js'
import { useAuth } from '../store/auth.js'

const CATEGORIES = ['all', 'ai', 'dev', 'design']

const tools = ref([])
const loading = ref(true)
const loadError = ref(null)

const searchQuery = ref('')
const categoryFilter = ref('all')
const sortBy = ref('newest')

const router = useRouter()
const { currentUser } = useAuth()
const { t } = useI18n()

const likedToolIds = ref([])
const pendingLikeToolId = ref(null)

const SORT_OPTIONS = computed(() => [
  { value: 'newest', label: t('sort.newest') },
  { value: 'popular', label: t('sort.popular') },
])

function toMillis(val) {
  if (val == null) return 0
  if (typeof val?.toDate === 'function') return val.toDate().getTime()
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'number') return val
  return 0
}

const filteredSortedTools = computed(() => {
  let list = [...tools.value]

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((t) => {
      const title = String(t.title ?? '').toLowerCase()
      const desc = String(t.description ?? '').toLowerCase()
      return title.includes(q) || desc.includes(q)
    })
  }

  if (categoryFilter.value !== 'all') {
    const cat = categoryFilter.value.toLowerCase()
    list = list.filter(
      (t) => String(t.category ?? '').toLowerCase() === cat,
    )
  }

  if (sortBy.value === 'popular') {
    list.sort(
      (a, b) => (Number(b.likesCount) || 0) - (Number(a.likesCount) || 0),
    )
  } else {
    list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
  }

  return list
})

function isLiked(toolId) {
  return likedToolIds.value.includes(toolId)
}

async function handleToggleLike(tool) {
  if (!currentUser.value?.uid) {
    router.push({ name: 'auth', query: { redirect: '/home' } })
    return
  }

  const id = tool.id
  if (pendingLikeToolId.value === id) return

  const wasLiked = likedToolIds.value.includes(id)
  const next = new Set(likedToolIds.value)
  if (wasLiked) next.delete(id)
  else next.add(id)
  likedToolIds.value = [...next]

  const idx = tools.value.findIndex((t) => t.id === id)
  if (idx !== -1) {
    const cur = Number(tools.value[idx].likesCount) || 0
    const delta = wasLiked ? -1 : 1
    tools.value[idx] = {
      ...tools.value[idx],
      likesCount: Math.max(0, cur + delta),
    }
  }

  pendingLikeToolId.value = id
  try {
    const { liked } = await toggleLike(currentUser.value.uid, id)

    if (liked !== !wasLiked) {
      const sync = new Set(likedToolIds.value)
      if (liked) sync.add(id)
      else sync.delete(id)
      likedToolIds.value = [...sync]

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
    const rollback = new Set(likedToolIds.value)
    if (wasLiked) rollback.add(id)
    else rollback.delete(id)
    likedToolIds.value = [...rollback]

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

async function loadLikedState() {
  if (currentUser.value?.uid) {
    try {
      likedToolIds.value = await getUserLikedToolIds(currentUser.value.uid)
    } catch (e) {
      console.error(e)
      likedToolIds.value = []
    }
    return
  }

  likedToolIds.value = []
}

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    const [allTools] = await Promise.all([getTools(), loadLikedState()])
    tools.value = allTools
  } catch (e) {
    loadError.value = t('home.loadError')
  } finally {
    loading.value = false
  }
})

watch(
  () => currentUser.value?.uid,
  () => {
    loadLikedState()
  },
)
</script>

<template>
  <div class="pb-16 pt-10 sm:pb-24 sm:pt-14">
    <!-- Hero -->
    <section
      class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <h1
        id="hero-heading"
        class="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
      >
        {{ t('home.title') }}
      </h1>
      <p
        class="mx-auto mb-10 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-400"
      >
        {{ t('home.subtitle') }}
      </p>

      <div class="relative mx-auto max-w-xl">
        <label for="tool-search" class="sr-only">{{ t('home.searchLabel') }}</label>
        <span
          class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="h-5 w-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </span>
        <input
          id="tool-search"
          v-model="searchQuery"
          type="search"
          autocomplete="off"
          :placeholder="t('home.searchPlaceholder')"
          class="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
        />
      </div>
    </section>

    <!-- Filters & sort -->
    <section
      id="browse"
      class="mx-auto mt-14 max-w-7xl px-4 sm:mt-16 sm:px-6 lg:px-8"
      :aria-label="t('home.filtersAria')"
    >
      <div
        class="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/50 dark:ring-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5"
      >
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            {{ t('home.category') }}
          </span>
          <AppButton
            v-for="cat in CATEGORIES"
            :key="cat"
            type="button"
            size="sm"
            :variant="categoryFilter === cat ? 'primary' : 'outline'"
            @click="categoryFilter = cat"
          >
            {{ t(`categories.${cat}`) }}
          </AppButton>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <label
            for="sort-select"
            class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            {{ t('sort.sortBy') }}
          </label>
          <div class="relative">
            <select
              id="sort-select"
              v-model="sortBy"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-800 shadow-sm transition hover:border-sky-300 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/25 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-600"
            >
              <option
                v-for="opt in SORT_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
            <span
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                class="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Grid -->
    <section
      class="mx-auto mt-10 max-w-7xl px-4 sm:mt-12 sm:px-6 lg:px-8"
      aria-live="polite"
    >
      <div
        v-if="loading"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="h-56 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
        />
      </div>

      <div
        v-else-if="loadError"
        class="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
      >
        {{ loadError }}
      </div>

      <div
        v-else-if="filteredSortedTools.length === 0"
        class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
      >
        <p class="text-lg font-medium text-slate-700 dark:text-slate-200">
          {{ t('home.noResultsTitle') }}
        </p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {{ t('home.noResultsText') }}
        </p>
      </div>

      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <ToolCard
          v-for="tool in filteredSortedTools"
          :key="tool.id"
          :tool="tool"
          :liked="isLiked(tool.id)"
          :like-pending="pendingLikeToolId === tool.id"
          @toggle-like="handleToggleLike(tool)"
        />
      </div>
    </section>
  </div>
</template>
