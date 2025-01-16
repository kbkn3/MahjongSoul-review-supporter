import { useEffect, useState } from 'react'
import { Storage } from "@plasmohq/storage"
import type { NagaData, LanguageType } from './types'
import NAGAPanel from './components/NAGAPanel'
import { transferToNAGA } from './utils/transfer'
import { getMessage } from './utils/i18n'

const Popup = () => {
  const [displayLang, setDisplayLang] = useState<LanguageType>(0)
  const [nagaData, setNagaData] = useState<NagaData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)

  const storage = new Storage()

  useEffect(() => {
    const loadData = async () => {
      const [storedLang, storedData] = await Promise.all([
        storage.get("DisplayLang"),
        storage.get("toNagaData")
      ])
      setDisplayLang(((storedLang as unknown) as LanguageType) ?? 0)
      setNagaData((storedData as unknown) as NagaData ?? null)
    }
    loadData()
  }, [storage])

  const handleTransfer = async () => {
    if (!nagaData) return
    
    setIsTransferring(true)
    setError(null)

    try {
      await transferToNAGA(nagaData)
      await storage.remove("toNagaData")
      setNagaData(null)
    } catch (_err) {
      const messageKey = 'errors.transfer'
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