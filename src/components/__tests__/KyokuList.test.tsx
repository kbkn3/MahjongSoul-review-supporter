import { expect, test, describe, mock, beforeAll } from "bun:test"
import { render, fireEvent } from "@testing-library/react"
import { JSDOM } from "jsdom"
import KyokuList from "../KyokuList"
import type { KyokuInfo, LanguageType } from "../../types"

// DOMのセットアップ
beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  // @ts-ignore
  global.document = dom.window.document
  // @ts-ignore
  global.window = dom.window
})

describe("KyokuList", () => {
  const mockItems: KyokuInfo[] = [
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

  test("renders kyoku information correctly", () => {
    const { getByText } = render(
      <KyokuList
        items={mockItems}
        displayLang={0 as LanguageType}
      />
    )

    expect(getByText("1局0本場")).toBeDefined()
    expect(getByText("和了")).toBeDefined()
  })

  test("handles selection correctly", () => {
    const mockOnSelect = mock(() => {})
    const { container } = render(
      <KyokuList
        items={mockItems}
        displayLang={0 as LanguageType}
        onSelect={mockOnSelect}
      />
    )

    // ボタンを直接選択
    const button = container.querySelector('button')
    if (!button) throw new Error('Button not found')
    
    fireEvent.click(button)
    expect(mockOnSelect).toHaveBeenCalledWith(0)
  })
}) 