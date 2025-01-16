import { expect, test, describe } from "bun:test"
import { TransferError, getErrorMessageKey } from "../transfer"

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