import { describe, test, expect } from "bun:test"
import { validateNagaData } from "../validate"
import type { NagaData } from "../../types/naga"

describe("validateNagaData", () => {
  const validData: NagaData = {
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

  test("正常なデータの場合はtrueを返す", () => {
    expect(validateNagaData(validData)).toBe(true)
  })

  test("必須フィールドが欠けている場合はfalseを返す", () => {
    const invalidData = { ...validData, kyokuId: "" }
    expect(validateNagaData(invalidData)).toBe(false)
  })

  test("スコアデータが不正な場合はfalseを返す", () => {
    const invalidData = { ...validData, scores: [25000, 25000, 25000] }
    expect(validateNagaData(invalidData)).toBe(false)
  })

  test("局情報が不正な場合はfalseを返す", () => {
    const invalidData1 = { ...validData, kyoku: 0 }
    const invalidData2 = { ...validData, bakaze: "西" }
    const invalidData3 = { ...validData, honba: -1 }

    expect(validateNagaData(invalidData1)).toBe(false)
    expect(validateNagaData(invalidData2)).toBe(false)
    expect(validateNagaData(invalidData3)).toBe(false)
  })
}) 