import { memo } from 'react'
import type { Language } from '../../i18n/messages'
import { getMessage } from '../../utils/i18n'

interface StatCardProps {
  messageKey: string
  value: number
  lang: Language
  format?: (value: number) => string
}

export const StatCard = memo(({ messageKey, value, lang, format = (v) => v.toString() }: StatCardProps) => (
  <div className="bg-gray-50 p-4 rounded">
    <div className="text-sm text-gray-600">{getMessage(messageKey, lang)}</div>
    <div className="text-2xl font-bold">{format(value)}</div>
  </div>
))

StatCard.displayName = 'StatCard' 