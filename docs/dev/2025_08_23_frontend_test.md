# フロントエンドコンポーネントテストの整備

## 目的

t-wada氏が提唱するTDD（テスト駆動開発）を採用し、今後の機能開発を効率的かつ高品質に進めるため、フロントエンドテストを充実させる。

## 基本方針

### t-wada TDDの原則

1. **Red-Green-Refactor サイクル**
   - Red: 失敗するテストを最初に書く
   - Green: テストを通す最小限のコードを実装
   - Refactor: コードを改善しながらテストが通ることを確認

2. **テストファースト**
   - 実装前に期待する振る舞いをテストで定義
   - テストが仕様書となる

3. **小さなステップ**
   - 一度に一つのことだけをテスト
   - 段階的に機能を構築

## 現状分析（2025年8月23日時点）

### 既存のテスト環境

- **Vitest**: インストール済み（v3.2.4）
- **@vue/test-utils**: インストール済み（v2.4.0）
- **jsdom**: インストール済み（v23.0.0）
- **vitest.config.js**: 基本設定済み

### テストカバレッジ現状

- **ユニットテスト**: 5ファイル（ユーティリティ関数のみ）
  - dataConversion.spec.js
  - fan_name_fix_validation.spec.js
  - mjsoulToTenhou.spec.js
  - scoring.spec.js
  - wxtMigration.spec.js
- **Vueコンポーネントテスト**: 0ファイル（未実装）
- **統合テスト**: 0ファイル（未実装）

### 対象Vueコンポーネント（9ファイル）

- components/popup/: 4ファイル
  - App.vue
  - NagaList.vue
  - MjaiList.vue
  - Kyoku.vue
  - RecipeList.vue
- components/options/: 3ファイル
  - App.vue
  - InputSelect.vue
  - LangList.vue
- components/: 1ファイル
  - iconTrash.vue

## 技術スタック

### 選定ツール

- **Vitest**: ✅ 導入済み
- **@vue/test-utils**: ✅ 導入済み
- **@testing-library/vue**: 追加予定（ユーザー視点のテスト）
- **happy-dom**: 追加予定（jsdomより高速）
- **MSW**: オプション（API モッキング用）

### 選定理由

1. **Vitest**
   - Viteとの完全な互換性（設定共有）
   - 高速実行（HMR対応）
   - Jest互換API
   - TypeScript対応
   - ウォッチモード標準搭載

2. **@vue/test-utils**
   - Vue3公式サポート
   - Composition API完全対応
   - 豊富なAPIとドキュメント

3. **@testing-library/vue**
   - ユーザー視点でのテスト記述
   - アクセシビリティを考慮したクエリ
   - より保守性の高いテスト

## 実装計画

### フェーズ1: 基盤整備（1週目）

#### 1.1 テスト環境セットアップ

```bash
# 追加パッケージのインストール
npm install -D @testing-library/vue happy-dom
```

#### 1.2 Vitest設定の最適化

```javascript
// vitest.config.js を更新
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom', // jsdom から happy-dom に変更
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        'dist*/',
        'entrypoints/injected/**',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './'),
    },
  },
})
```

#### 1.3 テストセットアップファイル更新

```javascript
// tests/setup.js を更新
import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 既存のChrome APIモックを拡張
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
```

### フェーズ2: コンポーネントテスト実装（2週目）

#### 2.1 テストディレクトリ構造

```
components/
├── popup/
│   ├── NagaList.vue
│   └── __tests__/
│       └── NagaList.test.ts
├── options/
│   ├── OptionsForm.vue
│   └── __tests__/
│       └── OptionsForm.test.ts
└── __tests__/
    └── helpers/
        ├── mount.ts
        └── factories.ts
```

#### 2.2 NagaList.vueのテスト例（TDD実践）

```typescript
// components/popup/__tests__/NagaList.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import NagaList from '../NagaList.vue'

describe('NagaList', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(NagaList, {
      props: {
        // 必要なpropsを設定
      },
      global: {
        mocks: {
          $t: (key) => key // i18n のモック
        }
      }
    })
  })

  describe('初期表示', () => {
    it('ローディング中はスピナーを表示する', async () => {
      // Red: まずテストを書く
      await wrapper.setData({ isLoading: true })
      expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
    })

    it('データがない場合は空状態メッセージを表示する', () => {
      // Red: 空状態のテスト
      expect(wrapper.find('[data-testid="empty-state"]').text())
        .toContain('牌譜データがありません')
    })

    it('エラーがある場合はエラーメッセージを表示する', async () => {
      // Red: エラー状態のテスト
      await wrapper.setData({ error: 'データ取得に失敗しました' })
      expect(wrapper.find('[data-testid="error-message"]').text())
        .toContain('データ取得に失敗しました')
    })
  })

  describe('局選択機能', () => {
    it('局をクリックすると選択状態になる', async () => {
      // Green: 最小限の実装でテストを通す
      const kyokus = [
        { id: 1, name: '東1局', selected: false },
        { id: 2, name: '東2局', selected: false }
      ]
      await wrapper.setData({ kyokus })
      
      await wrapper.find('[data-testid="kyoku-1"]').trigger('click')
      expect(wrapper.vm.selectedKyokus).toContain(1)
    })

    it('全選択ボタンですべての局を選択できる', async () => {
      // Refactor: コードを改善
      const kyokus = [
        { id: 1, name: '東1局' },
        { id: 2, name: '東2局' },
        { id: 3, name: '東3局' }
      ]
      await wrapper.setData({ kyokus })
      
      await wrapper.find('[data-testid="select-all"]').trigger('click')
      expect(wrapper.vm.selectedKyokus).toHaveLength(3)
    })
  })

  describe('外部連携', () => {
    it('NAGA分析ボタンでタブを開く', async () => {
      const createTabSpy = vi.spyOn(chrome.tabs, 'create')
      await wrapper.find('[data-testid="naga-analyze"]').trigger('click')
      
      expect(createTabSpy).toHaveBeenCalledWith({
        url: expect.stringContaining('naga.dmv.nico')
      })
    })
  })
})
```

#### 2.3 ユーティリティ関数のテスト

```typescript
// src/utils/__tests__/mahjongDataParser.test.ts
import { describe, it, expect } from 'vitest'
import { generatelog, calculatePtEV } from '../mahjongDataParser'

describe('mahjongDataParser', () => {
  describe('generatelog', () => {
    it('雀魂形式の牌譜をTenhou形式に変換する', () => {
      // Arrange
      const mjsoulData = {
        // テストデータ
      }
      
      // Act
      const result = generatelog(mjsoulData)
      
      // Assert
      expect(result).toMatch(/^{/)
      expect(result).toContain('"rule":')
      expect(result).toContain('"log":')
    })
  })

  describe('calculatePtEV', () => {
    it('期待値を正しく計算する', () => {
      // TDDの実践例
      const testCases = [
        { input: [25000, 25000, 25000, 25000], expected: [0, 0, 0, 0] },
        { input: [30000, 25000, 25000, 20000], expected: [15, 5, 5, -25] }
      ]
      
      testCases.forEach(({ input, expected }) => {
        expect(calculatePtEV(input)).toEqual(expected)
      })
    })
  })
})
```

### フェーズ3: Chrome拡張機能APIテスト（3週目）

#### 3.1 Content Script通信のテスト

```javascript
// tests/unit/contentScript.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Content Script Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Message Handling', () => {
    it('should send message to background script', async () => {
      // Arrange
      const testMessage = { type: 'GET_GAME_DATA', payload: {} }
      chrome.runtime.sendMessage.mockResolvedValue({ success: true })

      // Act
      const response = await chrome.runtime.sendMessage(testMessage)

      // Assert
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage)
      expect(response).toEqual({ success: true })
    })

    it('should handle tab communication', async () => {
      // Arrange
      const tabId = 1
      const message = { action: 'tabNaga' }
      chrome.tabs.sendMessage.mockResolvedValue({ data: 'response' })

      // Act
      const response = await chrome.tabs.sendMessage(tabId, message)

      // Assert
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message)
      expect(response).toEqual({ data: 'response' })
    })
  })

  describe('Storage Operations', () => {
    it('should save data to chrome storage', async () => {
      // Arrange
      const testData = { kyokus: [], settings: {} }

      // Act
      await chrome.storage.local.set(testData)

      // Assert
      expect(chrome.storage.local.set).toHaveBeenCalledWith(testData)
    })

    it('should retrieve data from chrome storage', async () => {
      // Arrange
      const storedData = { kyokus: ['test'] }
      chrome.storage.local.get.mockResolvedValue(storedData)

      // Act
      const result = await chrome.storage.local.get(['kyokus'])

      // Assert
      expect(result).toEqual(storedData)
    })
  })
})
```

### フェーズ4: 統合テスト（4週目）

#### 4.1 E2Eテストシナリオ

```typescript
// tests/e2e/review-flow.test.ts
import { describe, it, expect } from 'vitest'
import { chromium } from 'playwright'

describe('牌譜レビューフロー', () => {
  it('雀魂から牌譜を取得してNAGA分析に送信できる', async () => {
    // 1. 雀魂ページを開く
    // 2. 拡張機能ポップアップを開く
    // 3. 牌譜データ取得
    // 4. 局を選択
    // 5. NAGA分析ボタンをクリック
    // 6. 新しいタブでNAGAが開くことを確認
  })
})
```

## ベストプラクティス

### 1. テスト設計の原則

- **AAA パターン**: Arrange（準備）, Act（実行）, Assert（検証）
- **単一責任**: 1つのテストで1つの振る舞いのみをテスト
- **独立性**: テスト間の依存関係を排除
- **高速実行**: モックを活用して外部依存を排除

### 2. Vue3 Composition APIのテスト

- `setup()`関数の戻り値を直接テスト
- リアクティブな値の変更は`await nextTick()`を使用
- `provide/inject`は`global.provide`で設定

### 3. 非同期処理のテスト

```typescript
it('非同期データ取得をテストする', async () => {
  const wrapper = mount(AsyncComponent)
  
  // データ取得をトリガー
  await wrapper.find('button').trigger('click')
  
  // Promiseの解決を待つ
  await flushPromises()
  
  // DOMの更新を待つ
  await nextTick()
  
  expect(wrapper.text()).toContain('Data loaded')
})
```

### 4. カバレッジ目標

- **全体**: 80%以上
- **重要なビジネスロジック**: 95%以上
- **ユーティリティ関数**: 100%
- **UIコンポーネント**: 70%以上

## 実装スケジュール

| 週 | タスク | 成果物 |
|---|---|---|
| 1週目 | 基盤整備・設定最適化 | Vitest環境改善、テストヘルパー作成 |
| 2週目 | Vueコンポーネントテスト | 9コンポーネントのテスト実装（カバレッジ70%） |
| 3週目 | Chrome API・統合テスト | Content Script、Background Scriptのテスト |
| 4週目 | E2E・改善 | E2Eテスト実装、全体カバレッジ80%達成 |

## 優先実装コンポーネント

### 高優先度（ビジネスロジックが多い）

1. **NagaList.vue**: 牌譜データ表示・NAGA連携
2. **MjaiList.vue**: mjai-reviewer連携
3. **Kyoku.vue**: 局選択ロジック

### 中優先度（ユーザーインタラクション）

4. **popup/App.vue**: ポップアップのメインコンポーネント
5. **options/App.vue**: オプション画面
6. **InputSelect.vue**: フォーム入力コンポーネント

### 低優先度（表示のみ）

7. **RecipeList.vue**: レシピ一覧表示
8. **LangList.vue**: 言語選択
9. **iconTrash.vue**: アイコンコンポーネント

## TDDワークフロー実践例

### 新機能開発のTDDフロー

#### 例: 「局の自動選択機能」の実装

**Step 1: Red - 失敗するテストを書く**

```javascript
// tests/unit/components/popup/Kyoku.spec.js
describe('Kyoku - 自動選択機能', () => {
  it('勝利した局を自動選択する', () => {
    const wrapper = mount(Kyoku, {
      props: {
        kyokuData: {
          result: '和了',
          winner: 0,
          points: [8000, -2000, -3000, -3000]
        }
      }
    })
    
    // 期待: 勝利した局は自動的に選択される
    expect(wrapper.vm.isSelected).toBe(true)
    expect(wrapper.classes()).toContain('selected')
  })
})
```

**Step 2: Green - 最小限のコードで通す**

```vue
<!-- components/popup/Kyoku.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  kyokuData: Object
})

const isSelected = computed(() => {
  return props.kyokuData.result === '和了' && props.kyokuData.winner === 0
})
</script>
```

**Step 3: Refactor - コードを改善**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  kyokuData: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.hasOwnProperty('result')
    }
  }
})

const isWinningKyoku = computed(() => {
  const { result, winner } = props.kyokuData
  return result === '和了' && winner === 0
})

const isSelected = computed(() => isWinningKyoku.value)
</script>
```

### TDDチェックリスト

#### 新機能実装前

- [ ] 機能の仕様を明確に定義
- [ ] 失敗するテストケースを作成
- [ ] テストが失敗することを確認

#### 実装中

- [ ] 最小限のコードでテストを通す
- [ ] すべてのテストが通ることを確認
- [ ] エッジケースのテストを追加

#### 実装後

- [ ] コードのリファクタリング
- [ ] テストのリファクタリング
- [ ] カバレッジの確認
- [ ] ドキュメントの更新

## 参考資料

- [Vue.js Testing Guide](https://vuejs.org/guide/scaling-up/testing)
- [Vitest Documentation](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
- [t-wada TDD Resources](https://github.com/twada)
