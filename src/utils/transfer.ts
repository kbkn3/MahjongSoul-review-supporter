import type { NagaData } from '../types'

const ERROR_MESSAGE_MAP = {
  TAB_CREATE_FAILED: 'errors.tabCreate',
  TEXTAREA_NOT_FOUND: 'errors.textarea',
  SUBMIT_NOT_FOUND: 'errors.submit',
  TRANSFER_FAILED: 'errors.transfer',
  UNKNOWN_ERROR: 'errors.unknown'
} as const

export class TransferError extends Error {
  constructor(message: string, public code: keyof typeof ERROR_MESSAGE_MAP) {
    super(message)
    this.name = 'TransferError'
  }
}

export const getErrorMessageKey = (error: Error): string => {
  if (error instanceof TransferError) {
    return ERROR_MESSAGE_MAP[error.code]
  }
  return ERROR_MESSAGE_MAP.UNKNOWN_ERROR
}

export const transferToNAGA = async (data: NagaData): Promise<void> => {
  try {
    const tab = await chrome.tabs.create({
      url: 'https://naga.dmv.nico/naga_report/order_form/',
      active: true
    })

    if (!tab.id) {
      throw new TransferError('Failed to create tab', 'TAB_CREATE_FAILED')
    }

    // タブが完全に読み込まれるのを待つ
    await new Promise<void>((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      })
    })

    // Content Scriptを実行して牌譜データを転送
    await chrome.tabs.sendMessage(tab.id, {
      type: 'TRANSFER_TO_NAGA',
      data: data.log
    })
  } catch (_) {
    throw new TransferError(
      'Failed to transfer data to NAGA',
      'TRANSFER_FAILED'
    )
  }
} 