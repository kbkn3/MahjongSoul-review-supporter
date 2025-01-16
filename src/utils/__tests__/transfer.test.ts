import { expect, test, describe, mock } from "bun:test"
import { transferToNAGA, TransferError, getErrorMessageKey } from "../transfer"
import type { NagaData } from "../../types"

describe("TransferError", () => {
  test("creates error with correct code", () => {
    const error = new TransferError("Test error", "TAB_CREATE_FAILED")
    expect(error.code).toBe("TAB_CREATE_FAILED")
    expect(error.message).toBe("Test error")
  })
})

describe("getErrorMessageKey", () => {
  test("returns correct message key for TransferError", () => {
    const error = new TransferError("Test error", "TEXTAREA_NOT_FOUND")
    expect(getErrorMessageKey(error)).toBe("errors.textarea")
  })

  test("returns unknown error key for other errors", () => {
    const error = new Error("Generic error")
    expect(getErrorMessageKey(error)).toBe("errors.unknown")
  })
})

describe("transferToNAGA", () => {
  test("throws TAB_CREATE_FAILED when chrome.tabs.create fails", async () => {
    // モックの作成と実装
    const createTab = mock(() => Promise.resolve({ id: null }))
    const originalChrome = globalThis.chrome
    
    // chrome.tabs.createのみをモック
    globalThis.chrome = {
      ...originalChrome,
      tabs: {
        ...originalChrome.tabs,
        create: createTab
      }
    }

    const data: NagaData = {
      log: "test log",
      kyokuInfos: []
    }

    try {
      await transferToNAGA(data)
      expect(false).toBe(true) // このラインは実行されないはず
    } catch (error) {
      expect(error).toBeInstanceOf(TransferError)
      expect((error as TransferError).code).toBe("TAB_CREATE_FAILED")
      expect(createTab).toHaveBeenCalledTimes(1)
    }
  })
}) 