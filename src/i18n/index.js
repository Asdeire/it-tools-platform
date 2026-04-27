import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import uk from '../locales/uk.json'

const STORAGE_KEY = 'it-tools-locale'
const SUPPORTED_LOCALES = ['en', 'uk']

function getInitialLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.includes(saved)) {
    return saved
  }

  const browser = navigator.language?.toLowerCase() || ''
  if (browser.startsWith('uk')) {
    return 'uk'
  }

  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    uk,
  },
})

export function setLocale(nextLocale) {
  if (!SUPPORTED_LOCALES.includes(nextLocale)) return
  i18n.global.locale.value = nextLocale
  localStorage.setItem(STORAGE_KEY, nextLocale)
}
