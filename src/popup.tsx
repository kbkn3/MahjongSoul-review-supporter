import { useEffect, useState } from 'react'
import type { NagaData, LanguageType } from './types'
import NAGAPanel from './components/NAGAPanel'
import { transferToNAGA } from './utils/transfer'
import { getMessage } from './utils/i18n'
import { getErrorMessageKey } from './utils/transfer'

const Popup = () => {
  const [displayLang, setDisplayLang] = useState<LanguageType>(0)
  const [nagaData, setNagaData] = useState<NagaData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  useEffect(() => {
    chrome.storage.local.get(['DisplayLang', 'toNagaData'], (result) => {
      setDisplayLang(result.DisplayLang ?? 0)
      setNagaData(result.toNagaData ?? null)
    })
  }, [])

  const handleTransfer = async () => {
    if (!nagaData) return
    
    setIsTransferring(true)
    setError(null)

    try {
      await transferToNAGA(nagaData)
      await chrome.storage.local.remove('toNagaData')
      setNagaData(null)
    } catch (err) {
      const messageKey = err instanceof Error ? 
        getErrorMessageKey(err) : 
        'errors.unknown'
      setError(getMessage(displayLang, `naga.${messageKey}`))
    } finally {
      setIsTransferring(false)
    }
  }

  return (
    <div className="w-[400px] p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {nagaData ? (
        <NAGAPanel
          displayLang={displayLang}
          data={nagaData}
          onTransfer={handleTransfer}
          className="mb-4"
          disabled={isTransferring}
        />
      ) : (
        <div className="text-center text-gray-500">
          {getMessage(displayLang, 'naga.noData')}
        </div>
      )}
    </div>
  )
}

export default Popup 