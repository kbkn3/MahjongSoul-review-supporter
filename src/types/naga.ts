import type { Language } from '../i18n/messages'

export interface NagaData {
  // 対局情報
  kyokuId: string
  playerName: string
  
  // 局情報
  bakaze: string  // 場風 (東/南)
  kyoku: number   // 局数 (1-4)
  honba: number   // 本場数
  
  // 点数情報
  scores: number[]  // プレイヤーの点数配列
  deltas: number[]  // 点数の増減配列
  
  // 追加情報
  timestamp: string  // 対局時刻
  lobby: number     // ロビー番号 (0: 段位戦, etc)
  rule: number      // ルール番号
}

// NAGAサイトのフォーム入力値の型
export interface NagaFormData {
  title: string        // タイトル
  description: string  // 説明
  url: string         // 牌譜URL
  kyoku_num: number   // 局数
}

// エラーコードの定義
export const NAGA_ERROR_CODES = {
  TAB_CREATE_FAILED: 'TAB_CREATE_FAILED',
  TEXTAREA_NOT_FOUND: 'TEXTAREA_NOT_FOUND',
  SUBMIT_NOT_FOUND: 'SUBMIT_NOT_FOUND',
  TRANSFER_FAILED: 'TRANSFER_FAILED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type NagaErrorCode = typeof NAGA_ERROR_CODES[keyof typeof NAGA_ERROR_CODES]

// メッセージングの型定義
export interface NagaRequest {
  type: 'TRANSFER_TO_NAGA'
  data: NagaData
  lang?: Language  // 言語設定（オプショナル、デフォルトは'ja'）
}

export interface NagaResponse {
  success: boolean
  error?: {
    code: NagaErrorCode
    message: string
  }
} 