<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppButton from '../components/layout/AppButton.vue'
import ToolCard from '../components/tools/ToolCard.vue'
import {
  createTool,
  deleteTool,
  getUserTools,
  uploadToolImage,
  updateTool,
} from '../firebase/api.js'
import { useAuth } from '../store/auth.js'

const { currentUser } = useAuth()
const { t } = useI18n()

const loading = ref(true)
const errorMsg = ref('')
const tools = ref([])

const isModalOpen = ref(false)
const modalMode = ref('create') // 'create' | 'edit'
const activeToolId = ref(null)
const saving = ref(false)
const selectedImageFile = ref(null)
const imageUploadError = ref('')
const existingImageUrl = ref('')

const form = ref({
  title: '',
  description: '',
  category: 'Dev',
  link: '',
})

const categories = ['AI', 'Dev', 'Design']

const modalTitle = computed(() =>
  modalMode.value === 'create' ? t('myTools.createTitle') : t('myTools.editTitle'),
)

function openCreateModal() {
  modalMode.value = 'create'
  activeToolId.value = null
  form.value = {
    title: '',
    description: '',
    category: 'Dev',
    link: '',
  }
  existingImageUrl.value = ''
  isModalOpen.value = true
  errorMsg.value = ''
  imageUploadError.value = ''
  selectedImageFile.value = null
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
  existingImageUrl.value = String(tool.imageUrl ?? '').trim()
  isModalOpen.value = true
  errorMsg.value = ''
  imageUploadError.value = ''
  selectedImageFile.value = null
}

function closeModal() {
  if (saving.value) return
  isModalOpen.value = false
}

function onImageFileChange(event) {
  imageUploadError.value = ''
  const file = event?.target?.files?.[0] ?? null
  if (!file) {
    selectedImageFile.value = null
    return
  }

  if (!String(file.type || '').startsWith('image/')) {
    imageUploadError.value = t('myTools.uploadErrors.chooseImage')
    selectedImageFile.value = null
    return
  }

  const maxSizeBytes = 5 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    imageUploadError.value = t('myTools.uploadErrors.tooLarge')
    selectedImageFile.value = null
    return
  }

  selectedImageFile.value = file
}

async function refresh() {
  loading.value = true
  errorMsg.value = ''
  try {
    tools.value = await getUserTools(currentUser.value.uid)
  } catch (e) {
    errorMsg.value = t('myTools.loadError')
  } finally {
    loading.value = false
  }
}

async function onSave() {
  if (saving.value) return
  if (imageUploadError.value) return
  saving.value = true
  errorMsg.value = ''

  try {
    let uploadedImageUrl = existingImageUrl.value
    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadToolImage(
        currentUser.value.uid,
        selectedImageFile.value,
      )
    }

    const payload = {
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      category: form.value.category,
      link: form.value.link.trim(),
      imageUrl: uploadedImageUrl,
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
    selectedImageFile.value = null
    existingImageUrl.value = ''
  } catch (e) {
    if (String(e?.message || '').includes('missing_title')) {
      errorMsg.value = t('myTools.validation.enterTitle')
    } else if (String(e?.message || '').includes('missing_description')) {
      errorMsg.value = t('myTools.validation.enterDescription')
    } else {
      errorMsg.value = t('myTools.validation.saveFailed')
    }
  } finally {
    saving.value = false
  }
}

async function onDelete(tool) {
  const ok = confirm(
    t('myTools.validation.deleteConfirm', {
      title: tool.title || t('myTools.validation.fallbackTitle'),
    }),
  )
  if (!ok) return

  try {
    await deleteTool(tool.id)
    tools.value = tools.value.filter((t) => t.id !== tool.id)
  } catch (e) {
    alert(t('myTools.validation.deleteFailed'))
  }
}

onMounted(refresh)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {{ t('myTools.title') }}
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          {{ t('myTools.subtitle') }}
        </p>
      </div>

      <AppButton variant="primary" size="md" @click="openCreateModal">
        {{ t('myTools.addTool') }}
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
        {{ t('myTools.emptyTitle') }}
      </p>
      <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {{ t('myTools.emptyText') }}
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
        :aria-label="t('common.close')"
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
                {{ t('myTools.modalHint') }}
              </p>
            </div>
            <AppButton variant="ghost" size="sm" @click="closeModal">{{ t('common.close') }}</AppButton>
          </div>

          <form class="space-y-4" @submit.prevent="onSave">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('myTools.fieldTitle') }}
              </label>
              <input
                v-model="form.title"
                required
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                :placeholder="t('myTools.fieldTitlePlaceholder')"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('myTools.fieldDescription') }}
              </label>
              <textarea
                v-model="form.description"
                required
                rows="4"
                class="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                :placeholder="t('myTools.fieldDescriptionPlaceholder')"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ t('myTools.fieldCategory') }}
                </label>
                <select
                  v-model="form.category"
                  class="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                >
                  <option v-for="c in categories" :key="c" :value="c">
                    {{ t(`categories.${String(c).toLowerCase()}`) }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ t('myTools.fieldLink') }}
                </label>
                <input
                  v-model="form.link"
                  type="url"
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                  :placeholder="t('myTools.fieldLinkPlaceholder')"
                />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('myTools.uploadImage') }}
              </label>
              <input
                type="file"
                accept="image/*"
                class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ring-1 ring-slate-900/5 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sky-700 hover:file:bg-sky-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100 dark:ring-white/5 dark:file:bg-sky-900/30 dark:file:text-sky-300 dark:hover:file:bg-sky-900/50 dark:focus:border-sky-500 dark:focus:ring-sky-400/25"
                @change="onImageFileChange"
              />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {{ t('myTools.uploadHint') }}
              </p>
              <p
                v-if="existingImageUrl && !selectedImageFile"
                class="mt-1 text-xs text-slate-500 dark:text-slate-400"
              >
                {{ t('myTools.uploadCurrentHint') }}
              </p>
              <p
                v-if="selectedImageFile"
                class="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {{ t('myTools.uploadSelected', { name: selectedImageFile.name }) }}
              </p>
              <p
                v-if="imageUploadError"
                class="mt-1 text-xs font-medium text-red-600 dark:text-red-300"
              >
                {{ imageUploadError }}
              </p>
            </div>

            <div class="pt-2">
              <AppButton block size="lg" type="submit" :disabled="saving">
                <span v-if="saving">{{ t('common.saving') }}</span>
                <span v-else>{{ t('common.save') }}</span>
              </AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

