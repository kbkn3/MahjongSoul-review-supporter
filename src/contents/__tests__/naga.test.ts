import { describe, test, expect } from "bun:test"
import { handleNagaTransfer } from "../naga"
import type { NagaRequest } from "../../types/naga"

describe("handleNagaTransfer", () => {
  const mockRequest: NagaRequest = {
    type: "TRANSFER_TO_NAGA",
    data: {
      kyokuId: "test-id",
      playerName: "Player1",
      bakaze: "東",
      kyoku: 1,
      honba: 0,
      scores: [25000, 25000, 25000, 25000],
      deltas: [0, 0, 0, 0],
      timestamp: "2024-03-21T12:00:00",
      lobby: 0,
      rule: 1
    }
  }

  test("要素が見つからない場合はエラーを返す", async () => {
    // DOMをモックせずにテスト
    const result = await handleNagaTransfer(mockRequest)
    
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe("TEXTAREA_NOT_FOUND")
  })

  test("不正なデータの場合はエラーを返す", async () => {
    const invalidRequest: NagaRequest = {
      type: "TRANSFER_TO_NAGA",
      data: {
        ...mockRequest.data,
        scores: [] // 不正なスコアデータ
      }
    }
    
    const result = await handleNagaTransfer(invalidRequest)
    
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe("TRANSFER_FAILED")
  })
}) 