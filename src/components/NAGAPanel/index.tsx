import type { NagaData, LanguageType } from '../../types'
import KyokuList from '../KyokuList'
import { getMessage } from '../../utils/i18n'

interface NagaPanelProps {
  displayLang: LanguageType
  data: NagaData
  onTransfer?: () => void
  className?: string
  disabled?: boolean
}

const NAGAPanel = ({ displayLang, data, onTransfer, className, disabled }: NagaPanelProps) => {
  const t = (key: string) => getMessage(displayLang, `naga.${key}`)

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <h2 data-testid="naga-title">{t('title')}</h2>
      <KyokuList 
        items={data.kyokuInfos} 
        displayLang={displayLang}
      />
      
      <button
        type="button"
        onClick={onTransfer}
        disabled={disabled}
        data-testid="transfer-button"
        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {t('transfer')}
      </button>
      
      <div className="mt-2">
        <h3 data-testid="preview-title" className="text-sm font-bold mb-1">
          {t('preview')}
        </h3>
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
          {data.log}
        </pre>
      </div>
    </div>
  )
}

export default NAGAPanel 