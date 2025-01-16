import type { PlasmoCSConfig } from "plasmo"
import { TransferError } from '../utils/transfer'

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
  try {
    const textarea = document.querySelector('textarea[name="log"]') as HTMLTextAreaElement
    if (!textarea) {
      throw new TransferError('Textarea not found', 'TEXTAREA_NOT_FOUND')
    }

    textarea.value = logData

    const submitButton = document.querySelector('input[type="submit"]') as HTMLInputElement
    if (!submitButton) {
      throw new TransferError('Submit button not found', 'SUBMIT_NOT_FOUND')
    }

    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    submitButton.click()

  } catch (error) {
    console.error('NAGA transfer error:', error)
    throw error instanceof TransferError ? error : 
      new TransferError('Transfer failed', 'TRANSFER_FAILED')
  }
} 