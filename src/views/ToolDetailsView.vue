<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { getToolById } from '../firebase/api.js'

const route = useRoute()

const loading = ref(true)
const errorMsg = ref('')
const tool = ref(null)

const uploaderName = computed(() => {
  const email = String(tool.value?.authorEmail ?? '').trim()
  if (email) return email
  return 'Unknown uploader'
})

const toolImage = computed(() => {
  const imageUrl = String(tool.value?.imageUrl ?? '').trim()
  return imageUrl || 'https://placehold.co/1200x630?text=Tool+Image'
})

const toolLink = computed(() => {
  const raw = String(tool.value?.link ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
})

onMounted(async () => {
  loading.value = true
  errorMsg.value = ''
  tool.value = null

  try {
    const id = String(route.params.id ?? '')
    if (!id) {
      errorMsg.value = 'Tool id is missing.'
      return
    }

    const data = await getToolById(id)
    if (!data) {
      errorMsg.value = 'Tool not found.'
      return
    }

    tool.value = data
  } catch (e) {
    console.error(e)
    errorMsg.value = 'Could not load this tool. Please try again.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-6">
      <RouterLink
        to="/home"
        class="inline-flex items-center text-sm font-medium text-sky-700 no-underline hover:text-sky-800 dark:text-sky-300 dark:hover:text-sky-200"
      >
        ← Back to tools
      </RouterLink>
    </div>

    <div
      v-if="loading"
      class="h-64 animate-pulse rounded-3xl bg-slate-200/80 dark:bg-slate-800/80"
      aria-busy="true"
    />

    <div
      v-else-if="errorMsg"
      class="rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
    >
      {{ errorMsg }}
    </div>

    <article
      v-else
      class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900/40 dark:ring-white/5"
    >
      <img
        :src="toolImage"
        :alt="`${tool.title || 'Tool'} image`"
        class="h-64 w-full object-cover sm:h-80"
      />

      <div class="p-6 sm:p-8">
        <p
          class="mb-3 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {{ tool.category || 'General' }}
        </p>

        <h1 class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ tool.title || 'Untitled tool' }}
        </h1>

        <p class="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-600 dark:text-slate-300">
          {{ tool.description || 'No description yet.' }}
        </p>

        <div v-if="toolLink" class="mt-5">
          <a
            :href="toolLink"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center rounded-xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 no-underline transition hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50 dark:hover:text-sky-200"
          >
            Open tool link
          </a>
        </div>

        <div class="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Uploaded by
            <span class="font-semibold text-slate-900 dark:text-white">{{ uploaderName }}</span>
          </p>
        </div>
      </div>
    </article>
  </div>
</template>
