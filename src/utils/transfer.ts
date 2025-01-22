import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { NagaData } from "../types"

// メッセージハンドラーの型定義
export type TransferResponse = {
  success: boolean
  error?: string
}

export type TransferRequest = {
  data: NagaData
}

// Content Script向けのメッセージハンドラー
export const handler: PlasmoMessaging.MessageHandler<
  TransferRequest,
  TransferResponse
> = async (req, res) => {
  try {
    const tab = await chrome.tabs.create({
      url: 'https://naga.dmv.nico/naga_report/order_form/',
      active: true
    })

    if (!tab.id) {
      throw new Error('Failed to create tab')
    }

    // タブの読み込み完了を待つ
    await new Promise<void>((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      })
    })

    // Content Scriptを実行
    await chrome.tabs.sendMessage(tab.id, {
      type: 'TRANSFER_TO_NAGA',
      data: req.body.data.log
    })

    res.send({ success: true })
  } catch (err) {
    res.send({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    })
  }
}

// Popup側で使用する転送関数
export const transferToNAGA = async (data: NagaData): Promise<void> => {
  const resp = await chrome.runtime.sendMessage({
    name: "transferToNAGA",
    body: { data }
  })

  if (!resp.success) {
    throw new Error(resp.error)
  }
} 