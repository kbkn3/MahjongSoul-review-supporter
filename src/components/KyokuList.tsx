import type { KyokuInfo, LanguageType } from '../types'
import { getMessage } from '../utils/i18n'

interface KyokuListProps {
  items: KyokuInfo[]
  displayLang: LanguageType
  onSelect?: (index: number) => void
}

const KyokuList = ({ items, displayLang, onSelect }: KyokuListProps) => {
  const t = (key: string) => getMessage(displayLang, `naga.${key}`)

  return (
    <div className="grid gap-2">
      {items.map((item, index) => (
        <button
          type="button"
          key={`${item.kyoku}-${item.honba}`}
          className={`p-2 rounded border w-full text-left ${
            item.isSelect ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          } cursor-pointer`}
          onClick={() => onSelect?.(index)}
          onKeyDown={(e) => e.key === 'Enter' && onSelect?.(index)}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">
              {item.kyoku}{t('kyoku')}{item.honba}{t('honba')}
            </span>
            <span className="text-sm text-gray-600">
              {item.kyotaku > 0 ? `${t('kyotaku')}${item.kyotaku}${t('hon')}` : ''}
            </span>
          </div>
          <div className="text-sm mt-1">
            <span className="text-gray-600">{t('result')}: </span>
            <span className={item.result.includes('和了') ? 'text-red-600' : 'text-gray-800'}>
              {item.result}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

export default KyokuList 