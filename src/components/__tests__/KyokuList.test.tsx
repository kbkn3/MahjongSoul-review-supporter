import { expect, test, describe, mock } from "bun:test"
import { render, fireEvent } from "@testing-library/react"
import KyokuList from "../KyokuList"
import type { KyokuInfo, LanguageType } from "../../types"

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
    const mockOnSelect = mock()
    const { getByRole } = render(
      <KyokuList
        items={mockItems}
        displayLang={0 as LanguageType}
        onSelect={mockOnSelect}
      />
    )

    const button = getByRole("button")
    fireEvent.click(button)
    expect(mockOnSelect).toHaveBeenCalledWith(0)
  })
}) 