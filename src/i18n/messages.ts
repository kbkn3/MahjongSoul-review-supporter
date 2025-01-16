export const messages = {
  ja: {
    naga: {
      title: 'NAGA転送',
      preview: 'プレビュー',
      transfer: 'NAGAに転送',
      kyoku: '局',
      honba: '本場',
      kyotaku: '供託',
      hon: '本',
      result: '結果',
      noData: 'データがありません',
      transferError: '転送に失敗しました',
      errors: {
        tabCreate: 'タブの作成に失敗しました',
        textarea: 'テキストエリアが見つかりません',
        submit: '送信ボタンが見つかりません',
        transfer: '転送に失敗しました',
        unknown: '不明なエラーが発生しました',
        textareaNotFound: "テキストエリアが見つかりませんでした",
        submitNotFound: "送信ボタンが見つかりませんでした",
        transferFailed: "転送処理に失敗しました",
        invalidData: "データの形式が不正です",
        unknownError: "予期せぬエラーが発生しました",
        communicationError: "通信エラーが発生しました"
      }
    },
    title: "雀魂牌譜検討サポーター",
    transferButton: "転送"
  },
  en: {
    naga: {
      title: 'NAGA Transfer',
      preview: 'Preview',
      transfer: 'Transfer to NAGA',
      kyoku: '',
      honba: ' honba',
      kyotaku: ' riichi stick(s)',
      hon: '',
      result: 'Result',
      noData: 'No data available',
      transferError: 'Transfer failed',
      errors: {
        tabCreate: 'Failed to create tab',
        textarea: 'Textarea not found',
        submit: 'Submit button not found',
        transfer: 'Transfer failed',
        unknown: 'Unknown error occurred',
        textareaNotFound: "Textarea not found",
        submitNotFound: "Submit button not found",
        transferFailed: "Transfer failed",
        invalidData: "Invalid data format",
        unknownError: "Unexpected error occurred",
        communicationError: "Communication error occurred"
      }
    },
    title: "Mahjong Soul Review Supporter",
    transferButton: "Transfer"
  },
  zh: {
    naga: {
      title: 'NAGA转送',
      preview: '预览',
      transfer: '转送至NAGA',
      kyoku: '局',
      honba: '本场',
      kyotaku: '供托',
      hon: '本',
      result: '结果',
      noData: '没有数据',
      transferError: '传输失败',
      errors: {
        tabCreate: '无法创建标签页',
        textarea: '未找到文本区域',
        submit: '未找到提交按钮',
        transfer: '传输失败',
        unknown: '发生未知错误',
        textareaNotFound: "未找到文本区域",
        submitNotFound: "未找到提交按钮",
        transferFailed: "转送失败",
        invalidData: "数据格式无效",
        unknownError: "发生意外错误",
        communicationError: "发生通信错误"
      }
    },
    title: "雀魂牌谱研究助手",
    transferButton: "转送"
  }
} as const 

type RecursiveKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${RecursiveKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

export type MessageKey = RecursiveKeyOf<typeof messages.ja>
export type Language = keyof typeof messages 