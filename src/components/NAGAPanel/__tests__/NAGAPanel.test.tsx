import { expect, test, describe, mock, beforeAll, afterEach } from "bun:test"
import { render, fireEvent, cleanup } from "@testing-library/react"
import { JSDOM } from "jsdom"
import NAGAPanel from "../index"
import type { NagaData, LanguageType } from "../../../types"

// DOMのセットアップ
beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  // @ts-ignore
  global.document = dom.window.document
  // @ts-ignore
  global.window = dom.window
})

// 各テスト後にクリーンアップ
afterEach(cleanup)

describe("NAGAPanel", () => {
  const mockData: NagaData = {
    log: "test log data",
    kyokuInfos: [
      {
        kyoku: 1,
        honba: 0,
        kyotaku: 0,
        scores: [25000, 25000, 25000, 25000],
        tehais: [],
        result: "和了",
        isSelect: false
      }
    ]
  }

  test("renders panel correctly", () => {
    const { getByText, getByTestId } = render(
      <NAGAPanel
        displayLang={0 as LanguageType}
        data={mockData}
      />
    )

    // 基本要素の確認
    expect(getByTestId("naga-title")).toBeDefined()
    expect(getByText("プレビュー")).toBeDefined()
    expect(getByTestId("transfer-button")).toBeDefined()
    expect(getByText("test log data")).toBeDefined()
  })

  test("handles transfer click", () => {
    const mockTransfer = mock(() => {})
    const { getByTestId } = render(
      <NAGAPanel
        displayLang={0 as LanguageType}
        data={mockData}
        onTransfer={mockTransfer}
      />
    )

    const transferButton = getByTestId("transfer-button")
    fireEvent.click(transferButton)
    expect(mockTransfer).toHaveBeenCalledTimes(1)
  })

  test("disables transfer button when disabled prop is true", () => {
    const { getByTestId } = render(
      <NAGAPanel
        displayLang={0 as LanguageType}
        data={mockData}
        disabled={true}
      />
    )

    const transferButton = getByTestId("transfer-button")
    expect(transferButton.getAttribute("disabled")).toBe("")
    expect(transferButton.classList.contains("opacity-50")).toBe(true)
    expect(transferButton.classList.contains("cursor-not-allowed")).toBe(true)
  })

  test("renders in English", () => {
    const { getByTestId } = render(
      <NAGAPanel
        displayLang={1 as LanguageType}
        data={mockData}
      />
    )

    expect(getByTestId("naga-title")).toBeDefined()
    expect(getByTestId("preview-title")).toBeDefined()
    expect(getByTestId("transfer-button")).toBeDefined()
  })
}) 