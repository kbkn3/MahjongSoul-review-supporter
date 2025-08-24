// Vitestのグローバルセットアップ
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// Chrome extension API のモック
global.chrome = {
  storage: {
    local: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    },
    sync: {
      get: vi.fn(() => Promise.resolve({})),
      set: vi.fn(() => Promise.resolve()),
      remove: vi.fn(() => Promise.resolve()),
    }
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    getURL: vi.fn((path) => `chrome-extension://fake-id/${path}`)
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    sendMessage: vi.fn(),
    create: vi.fn(() => Promise.resolve({ id: 1 }))
  },
  i18n: {
    getMessage: vi.fn((key) => key),
    getUILanguage: vi.fn(() => 'ja')
  }
}

// Vue Test Utils のグローバル設定
config.global.mocks = {
  $t: (key) => key, // i18n モック
}