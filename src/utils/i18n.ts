import { messages } from '../i18n/messages'
import type { LanguageType } from '../types'

const langMap = {
  0: 'ja',
  1: 'en',
  2: 'zh'
} as const

export const getMessage = (lang: LanguageType, path: string) => {
  const langKey = langMap[lang]
  return path.split('.').reduce((obj, key) => obj?.[key], messages[langKey]) as string
} 