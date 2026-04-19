<script setup>
import { computed, onMounted, ref } from 'vue'
import AppButton from '../components/layout/AppButton.vue'
import ToolCard from '../components/tools/ToolCard.vue'
import {
  createTool,
  deleteTool,
  getUserTools,
  updateTool,
} from '../firebase/api.js'
import { useAuth } from '../store/auth.js'

const { currentUser } = useAuth()

const loading = ref(true)
const errorMsg = ref('')
const tools = ref([])

const isModalOpen = ref(false)
const modalMode = ref('create') // 'create' | 'edit'
const activeToolId = ref(null)
const saving = ref(false)

const form = ref({
  title: '',
  description: '',
  category: 'Dev',
  link: '',
})

const categories = ['AI', 'Dev', 'Design']

const modalTitle = computed(() =>
  modalMode.value === 'create' ? 'Submit a new tool' : 'Edit tool',
)

function openCreateModal() {
  modalMode.value = 'create'
  activeToolId.value = null
  form.value = { title: '', description: '', category: 'Dev', link: '' }
  isModalOpen.value = true
  errorMsg.value = ''
}

function openEditModal(tool) {
  modalMode.value = 'edit'
  activeToolId.value = tool.id
  form.value = {
    title: String(tool.title ?? ''),
    description: String(tool.description ?? ''),
    category: String(tool.category ?? 'Dev'),
    link: String(tool.link ?? ''),
  }
  isModalOpen.value = true
  errorMsg.value = ''
}

function closeModal() {
  if (saving.value) return
  isModalOpen.value = false
}

async function refresh() {
  loading.value = true
  errorMsg.value = ''
  try {
    tools.value = await getUserTools(currentUser.value.uid)
  } catch (e) {
    errorMsg.value = 'Could not load your tools. Please try again.'
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (saving.value) return
  saving.value = true
  errorMsg.value = ''

  try {
    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      link: form.value.link.trim(),
    }

    if (!payload.title) throw new Error('missing_title')
    if (!payload.description) throw new Error('missing_description')

    if (modalMode.value === 'create') {
      const toolData = {
        ...payload,
        authorId: currentUser.value.uid,
        authorEmail: currentUser.value.email ?? null,
      }
      const id = await createTool(toolData)
      tools.value = [{ id, ...toolData, likesCount: 0 }, ...tools.value]
    } else {
      await updateTool(activeToolId.value, payload)
      const idx = tools.value.findIndex((t) => t.id === activeToolId.value)
      if (idx !== -1) tools.value[idx] = { ...tools.value[idx], ...payload }
    }

    isModalOpen.value = false
  } catch (e) {
    if (String(e?.message || '').includes('missing_title')) {
      errorMsg.value = 'Please enter a title.'
    } else if (String(e?.message || '').includes('missing_description')) {
      errorMsg.value = 'Please enter a description.'
    } else {
      errorMsg.value = 'Could not save. Please try again.'
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(tool) {
  const ok = confirm(`Delete "${tool.title || 'this tool'}"?`)
  if (!ok) return

  try {
    await deleteTool(tool.id)
    tools.value = tools.value.filter((t) => t.id !== tool.id)
  } catch (e) {
    alert('Could not delete. Please try again.')
  }
}

onMounted(refresh)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Submitted Tools
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Create, edit, and manage tools you’ve submitted.
        </p>
      </div>

      <AppButton variant="primary" size="md" @click="openCreateModal">
        + Add Tool
      </AppButton>
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
      v-else-if="tools.length === 0"
      class="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/40"
    >
      <p class="text-lg font-medium text-slate-700 dark:text-slate-200">
        No tools yet.
      </p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Click “Add Tool” to submit your first one.
      </p>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ToolCard
        v-for="tool in tools"
        :key="tool.id"
        :tool="tool"
        :liked="false"
        :like-pending="false"
        :show-owner-actions="true"
        @toggle-like="() => {}"
        @edit="openEditModal(tool)"
        @delete="onDelete(tool)"
      />
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        class="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        aria-label="Close modal"
        @click="closeModal"
      />

      <div
        class="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:ring-white/5"
        role="dialog"
        aria-modal="true"
      >
        <div class="p-6 sm:p-8">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {{ modalTitle }}
              </h2>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Keep it concise and helpful.
              </p>
            </div>
            <AppButton variant="ghost" size="sm" @click="closeModal">Close</AppButton>
          </div>

          <form class="space-y-4" @submit.prevent="onSave">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Title
              </label>
              <input
                v-model="form.title"
                required
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                placeholder="e.g. JSON Formatter"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Description
              </label>
              <textarea
                v-model="form.description"
                required
                rows="4"
                class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                placeholder="What does it do, and why is it useful?"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Category
                </label>
                <select
                  v-model="form.category"
                  class="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                >
                  <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Link
                </label>
                <input
                  v-model="form.link"
                  type="url"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                  placeholder="https://…"
                />
              </div>
            </div>

            <div class="pt-2">
              <AppButton block size="lg" type="submit" :disabled="saving">
                <span v-if="saving">Saving…</span>
                <span v-else>Save</span>
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

