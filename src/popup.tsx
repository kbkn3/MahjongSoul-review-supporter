import { useEffect, useState } from 'react'
import { Storage } from "@plasmohq/storage"
import { sendToContentScript } from "@plasmohq/messaging"
import type { NagaData } from './types'
import type { Language } from './types'
import NAGAPanel from './components/NAGAPanel'
import { transferToNAGA } from './utils/transfer'
import { getMessage } from './utils/i18n'

const storage = new Storage()

const Popup = () => {
  const [displayLang, setDisplayLang] = useState<Language>('ja')
  const [nagaData, setNagaData] = useState<NagaData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedLang, storedData] = await Promise.all([
          storage.get("DisplayLang"),
          storage.get("toNagaData")
        ])
        setDisplayLang(((storedLang as unknown) as Language) ?? 'ja')
        setNagaData((storedData as unknown) as NagaData ?? null)
        console.log("aaa")
        // content scriptにメッセージを送信
        const response = await sendToContentScript({
          name: "getPaifu",
        })
        console.log("bbb")
        if (response.error) {
          setError(getMessage('naga.noData', displayLang))
          return
        }
        console.log("ccc")
        // 受け取ったデータを処理
        const { paifu } = response

        // 牌譜データを保存
        const newNagaData: NagaData = {
          log: paifu,
          kyokuInfos: []  // TODO: kyokuInfosの生成処理を実装
        }
        await storage.set("toNagaData", newNagaData)
        setNagaData(newNagaData)
        
        setIsLoading(false)
      } catch (_err) {
        setError(getMessage('naga.transferError', displayLang))
      }
    }
    loadData()
  }, [displayLang])

  const handleTransfer = async () => {
    if (!nagaData) return
    
    setIsTransferring(true)
    setError(null)

    try {
      await transferToNAGA(nagaData)
      await storage.remove("toNagaData")
      setNagaData(null)
    } catch (_err) {
      setError(getMessage('naga.errors.transfer', displayLang))
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
      
      {isLoading ? (
        <div className="text-center text-gray-500">
          読み込み中...
        </div>
      ) : nagaData ? (
        <NAGAPanel
          displayLang={displayLang}
          data={nagaData}
          onTransfer={handleTransfer}
          className="mb-4"
          disabled={isTransferring}
        />
      ) : (
        <div className="text-center text-gray-500">
          {getMessage('naga.noData', displayLang)}
        </div>
      )}
    </div>
  )
}

export default Popup 