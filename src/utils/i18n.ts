import { messages, type MessageKey, type Language } from '../i18n/messages'

type MessageValue = string | Record<string, unknown>

export function getMessage(key: MessageKey, lang: Language = 'ja'): string {
  const keys = key.split('.')
  let value: MessageValue = messages[lang]
  
  for (const k of keys) {
    value = (value as Record<string, MessageValue>)[k]
  }
  
  return value as string || key
} 