<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) =>
      ['primary', 'outline', 'ghost', 'outlineSky', 'solidSky'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]'

const variants = {
  primary:
    'bg-sky-600 text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400',
  outline:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-sky-400 hover:bg-sky-50/80 hover:text-sky-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:bg-slate-800',
  ghost:
    'text-slate-600 hover:bg-slate-100/90 dark:text-slate-300 dark:hover:bg-slate-800',
  outlineSky:
    'border-2 border-sky-500/70 bg-transparent text-sky-700 hover:bg-sky-50 dark:border-sky-400/80 dark:text-sky-300 dark:hover:bg-sky-950/50',
  solidSky:
    'bg-sky-600 text-white shadow-sm hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

const className = computed(() => [
  base,
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button :type="type" :disabled="disabled" :class="className">
    <slot />
  </button>
</template>
