import type { NagaData } from "../types/naga"

export function validateNagaData(data: NagaData): boolean {
  // 必須フィールドの存在チェック
  if (!data.kyokuId || !data.playerName) {
    return false
  }

  // スコアデータの検証
  if (!Array.isArray(data.scores) || data.scores.length !== 4) {
    return false
  }

  if (!Array.isArray(data.deltas) || data.deltas.length !== 4) {
    return false
  }

  // 局情報の検証
  if (data.kyoku < 1 || data.kyoku > 4) {
    return false
  }

  if (data.bakaze !== "東" && data.bakaze !== "南") {
    return false
  }

  if (data.honba < 0) {
    return false
  }

  return true
} 