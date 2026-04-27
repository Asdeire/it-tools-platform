<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppButton from '../layout/AppButton.vue'

const props = defineProps({
  tool: {
    type: Object,
    required: true,
  },
  liked: {
    type: Boolean,
    default: false,
  },
  likePending: {
    type: Boolean,
    default: false,
  },
  showOwnerActions: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle-like', 'edit', 'delete'])
const router = useRouter()
const { t } = useI18n()
const cardImage = computed(() => {
  const imageUrl = String(props.tool?.imageUrl ?? '').trim()
  return imageUrl || 'https://placehold.co/800x450?text=Tool+Image'
})
const likesText = computed(() => {
  const count = Number(props.tool?.likesCount) || 0
  return t('tool.likes', count, { count })
})

function openDetails() {
  router.push({ name: 'tool-details', params: { id: props.tool.id } })
}

function onLikeClick() {
  emit('toggle-like')
}

function onEditClick() {
  emit('edit')
}

function onDeleteClick() {
  emit('delete')
}
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md hover:shadow-sky-500/10 dark:border-slate-800 dark:bg-slate-900/40 dark:ring-white/5 dark:hover:border-sky-700/80 dark:hover:shadow-sky-900/20"
    role="link"
    tabindex="0"
    @click="openDetails"
    @keydown.enter.prevent="openDetails"
    @keydown.space.prevent="openDetails"
  >
    <img
      :src="cardImage"
      :alt="t('tool.previewAlt', { title: tool.title || t('tool.untitledTool') })"
      class="h-40 w-full object-cover"
      loading="lazy"
    />
    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
        <span
          class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        >
          {{ tool.category || t('categories.general') }}
        </span>
        <span
          class="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400"
        >
          {{ likesText }}
        </span>
      </div>

      <h3
        class="mb-2 text-lg font-semibold tracking-tight text-slate-900 transition group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300"
      >
        {{ tool.title || t('tool.untitled') }}
      </h3>
      <p
        class="mb-6 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
      >
        {{ tool.description || t('tool.noDescription') }}
      </p>

      <div
        class="mt-auto flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex w-full gap-2 sm:w-auto">
          <AppButton
            :variant="liked ? 'solidSky' : 'outlineSky'"
            size="sm"
            :disabled="likePending"
            :aria-pressed="liked"
            @click.stop="onLikeClick"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              class="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            {{ liked ? t('tool.liked') : t('tool.like') }}
          </AppButton>
        </div>

        <div
          v-if="showOwnerActions"
          class="flex w-full gap-2 sm:w-auto sm:justify-end"
        >
          <AppButton
            class="flex-1 sm:flex-none"
            variant="outline"
            size="sm"
            @click.stop="onEditClick"
          >
            {{ t('tool.edit') }}
          </AppButton>
          <AppButton
            class="flex-1 sm:flex-none"
            variant="outline"
            size="sm"
            @click.stop="onDeleteClick"
          >
            {{ t('tool.delete') }}
          </AppButton>
        </div>
      </div>
    </div>
  </article>
</template>
