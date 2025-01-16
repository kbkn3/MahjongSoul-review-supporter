import { expect, test, describe } from "bun:test"
import { getMessage } from "../i18n"
import type { LanguageType } from "../../types"

describe("getMessage", () => {
  test("returns correct Japanese message", () => {
    const lang: LanguageType = 0
    expect(getMessage(lang, "naga.title")).toBe("NAGA転送")
    expect(getMessage(lang, "naga.preview")).toBe("プレビュー")
  })

  test("returns correct English message", () => {
    const lang: LanguageType = 1
    expect(getMessage(lang, "naga.title")).toBe("NAGA Transfer")
    expect(getMessage(lang, "naga.preview")).toBe("Preview")
  })

  test("handles nested paths correctly", () => {
    const lang: LanguageType = 0
    expect(getMessage(lang, "naga.errors.unknown")).toBe("不明なエラーが発生しました")
  })
}) 