import { type NagaData, type NagaRequest, type NagaResponse, NAGA_ERROR_CODES } from '../types/naga'
import { validateNagaData } from '../utils/validate'
import { getMessage } from '../utils/i18n'
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://naga.dmv.nico/naga_report/order_form/*"]
}

// メッセージハンドラー
export async function handleNagaTransfer(request: NagaRequest): Promise<NagaResponse> {
  const { data, lang = 'ja' } = request

  // データの検証
  if (!validateNagaData(data)) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.TRANSFER_FAILED,
        message: getMessage('naga.errors.invalidData', lang)
      }
    }
  }

  // テキストエリアの検索
  let textarea: HTMLTextAreaElement | null
  try {
    textarea = document.querySelector('textarea[name="description"]')
  } catch (_error) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.TEXTAREA_NOT_FOUND,
        message: getMessage('naga.errors.textareaNotFound', lang)
      }
    }
  }

  if (!textarea) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.TEXTAREA_NOT_FOUND,
        message: getMessage('naga.errors.textareaNotFound', lang)
      }
    }
  }

  // 送信ボタンの検索
  let submitButton: HTMLInputElement | null
  try {
    submitButton = document.querySelector('input[type="submit"]')
  } catch (_error) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.SUBMIT_NOT_FOUND,
        message: getMessage('naga.errors.submitNotFound', lang)
      }
    }
  }

  if (!submitButton) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.SUBMIT_NOT_FOUND,
        message: getMessage('naga.errors.submitNotFound', lang)
      }
    }
  }

  // データの転送処理
  try {
    // テキストエリアにデータを設定
    textarea.value = JSON.stringify(data, null, 2)
    
    // フォーム送信
    submitButton.click()

    return { success: true }
  } catch (_error) {
    return {
      success: false,
      error: {
        code: NAGA_ERROR_CODES.TRANSFER_FAILED,
        message: getMessage('naga.errors.transferFailed', lang)
      }
    }
  }
}

// Plasmoメッセージハンドラー
export const handler = async (req: NagaRequest) => {
  if (req.type === 'TRANSFER_TO_NAGA') {
    return handleNagaTransfer(req)
  }
} 