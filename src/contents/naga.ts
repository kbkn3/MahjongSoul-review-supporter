import type { PlasmoCSConfig } from "plasmo"

// NAGAのドメインでのみ実行
export const config: PlasmoCSConfig = {
  matches: ["https://naga.dmv.nico/naga_report/order_form/*"]
}

// メッセージリスナーの設定
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  if (message.type === 'TRANSFER_TO_NAGA') {
    handleTransfer(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true // 非同期レスポンスのために必要
  }
})

// 転送処理の実装
const handleTransfer = async (logData: string): Promise<void> => {
  const textarea = document.querySelector('textarea[name="log"]') as HTMLTextAreaElement
  if (!textarea) {
    throw new Error('Textarea not found')
  }

  textarea.value = logData

  const submitButton = document.querySelector('input[type="submit"]') as HTMLInputElement
  if (!submitButton) {
    throw new Error('Submit button not found')
  }

  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  submitButton.click()
} 