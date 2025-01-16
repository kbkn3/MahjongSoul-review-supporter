import { mock } from "bun:test"
import "@testing-library/jest-dom"

// Chrome APIの型定義を修正
declare global {
  interface Window {
    chrome: {
      storage: {
        local: {
          get: (keys: string[]) => Promise<Record<string, unknown>>
          set: (items: Record<string, unknown>) => Promise<void>
          remove: (keys: string | string[]) => Promise<void>
        }
      }
      tabs: {
        create: (props: { url: string; active: boolean }) => Promise<{ id?: number }>
        sendMessage: (tabId: number, message: unknown) => Promise<unknown>
      }
    }
  }
}

// モックの実装
const chromeApi = {
  storage: {
    local: {
      get: mock(() => Promise.resolve({})),
      set: mock(() => Promise.resolve()),
      remove: mock(() => Promise.resolve())
    }
  },
  tabs: {
    create: mock(() => Promise.resolve({ id: 1 })),
    sendMessage: mock(() => Promise.resolve())
  }
}

globalThis.chrome = chromeApi 