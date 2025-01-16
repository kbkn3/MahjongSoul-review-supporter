# 雀魂牌譜検討サポーター v2 開発ログ

## 2024-03-XX: Tailwind CSS導入とスタイル最適化

### 実装した機能

1. Tailwind CSSの導入
   - 必要なパッケージのインストール
     - tailwindcss
     - postcss
     - autoprefixer
   - 設定ファイルの作成
     - postcss.config.js
     - tailwind.config.js
   - スタイルファイルの整理

2. コンポーネントのTailwind対応
   - カスタムCSSクラスの削除
   - Tailwindユーティリティクラスへの移行
   - レスポンシブデザインの改善
   - ダークモード対応の準備

### 発生したLinter Errors

1. 型関連の警告
   - 型のみのインポートに関する警告
   - 未使用の型インポートの警告
   - React.FCの使用に関する警告

2. 未使用変数の警告
   - displayLang, onErrorパラメータ
   - setKyokuList関数
   - kyokuパラメータ

3. その他の警告
   - 到達不能コードの警告
   - 配列indexをkeyとして使用する警告

### 次のステップ

1. Linter Errorsの解決
   - 型インポートの修正

   ```typescript
   import type { TabProps } from '../../types';
   ```

   - 未使用変数の整理
   - エラーハンドリングの実装

2. コンポーネントの実装
   - 局情報表示の実装
   - 転送処理の実装
   - エラー表示の実装

3. テスト計画
   - ユニットテストの設計
   - E2Eテストの検討
   - テストカバレッジの目標設定

### 参考情報

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Plasmo with Tailwind CSS](https://docs.plasmo.com/quickstarts/with-tailwindcss)

### 2024-03-XX: Linter Errors解決 - Phase 1

#### 完了した修正

1. 型定義の改善
   - `TabProps`の型を`LanguageType`を使用するように修正
   - `ComponentProps`をReactの型定義と連携
   - `any`型を`unknown`に置き換え

2. コンポーネントの改善
   - `Panel`コンポーネントから未使用の`handleError`を削除
   - 適切な型の継承関係を設定
   - 基本的な表示機能の実装

#### 次のステップ

1. コンポーネントの実装
   - NAGAパネルの実装

   ```typescript
   // 例: NAGAパネルの基本構造
   interface NagaPanelProps extends PanelProps {
     data: NagaData
   }
   ```

2. エラーハンドリング
   - エラー表示コンポーネントの作成
   - エラー状態の管理方法の設計

3. テスト
   - 各コンポーネントの単体テスト作成
   - エラーケースのテスト実装

### 2024-03-XX: 多言語対応の実装

#### 完了した実装

1. 多言語メッセージシステム
   - `messages.ts`で3言語（日本語、英語、中国語）のメッセージを定義
   - `i18n.ts`でメッセージ取得用のヘルパー関数を実装
   - 言語切り替えのための型安全な仕組みを構築

2. NAGAパネルの多言語化
   - コンポーネントに言語切り替え機能を実装
   - 局情報表示の多言語対応
   - ボタンやラベルの翻訳対応

3. アクセシビリティの改善
   - ボタン要素の適切な使用
   - キーボード操作のサポート
   - 適切な`type`属性の設定

#### 次のステップ

1. 転送機能の実装

   ```typescript
   // 例: 転送処理の基本構造
   const handleTransfer = async (data: NagaData) => {
     try {
       // 転送処理の実装
     } catch (error) {
       // エラーハンドリング
     }
   }
   ```

2. エラーハンドリング
   - エラー表示コンポーネントの作成
   - エラー状態の管理
   - ユーザーフレンドリーなエラーメッセージ

3. テスト
   - 多言語機能のテスト
   - 転送機能のテスト
   - エラーケースのテスト

### 2024-03-XX: エラーハンドリングの実装

#### 完了した実装

1. エラーメッセージの多言語対応
   - エラーメッセージを3言語で定義（日本語、英語、中国語）
   - エラーコードとメッセージのマッピング
   - 型安全なエラー管理システム

2. エラー処理の改善
   - `TransferError`クラスの拡張
   ```typescript
   const ERROR_MESSAGE_MAP = {
     TAB_CREATE_FAILED: 'errors.tabCreate',
     TEXTAREA_NOT_FOUND: 'errors.textarea',
     SUBMIT_NOT_FOUND: 'errors.submit',
     TRANSFER_FAILED: 'errors.transfer',
     UNKNOWN_ERROR: 'errors.unknown'
   } as const
   ```
   - エラーコードの型安全な管理
   - エラーメッセージの一元管理

3. Content Script対応
   - NAGAサイトでのエラーハンドリング
   - 適切なエラーコードの使用
   - エラー情報の伝播

#### 次のステップ

1. テスト環境の整備
   ```typescript
   // 例: エラーケースのテスト
   describe('TransferError', () => {
     it('should handle tab creation error', () => {
       // テストケースの実装
     })
   })
   ```

2. エラー表示の改善
   - エラーコンポーネントの作成
   - エラー状態の詳細な管理
   - リトライ機能の実装

3. ユーザーフィードバック
   - 転送状態の視覚的表示
   - エラー回復のガイダンス
   - 操作ログの実装

### 2024-03-XX: テスト環境の整備 - Phase 1

#### テスト戦略

1. テストランナーの設定
   - Bunの組み込みテストランナーを使用
   - Jest互換APIの活用
   - TypeScript/JSXのサポート

2. テストファイルの構成
   ```typescript
   // src/components/__tests__/NAGAPanel.test.tsx
   import { expect, test, mock } from "bun:test";
   import { NAGAPanel } from "../NAGAPanel";
   
   test("NAGAPanel renders correctly", () => {
     // コンポーネントのレンダリングテスト
   });
   ```

3. テストカバレッジ計画
   - コンポーネントテスト
     - レンダリング
     - イベントハンドリング
     - 多言語対応
   - ユーティリティテスト
     - 転送処理
     - エラーハンドリング
     - i18n機能

#### 実装計画

1. 基本設定
   ```typescript
   // test/setup.ts
   import { beforeAll, afterEach } from "bun:test";
   
   beforeAll(() => {
     // テスト環境のセットアップ
   });
   
   afterEach(() => {
     // 各テスト後のクリーンアップ
   });
   ```

2. CI/CD対応
   ```yaml
   # .github/workflows/test.yml
   - name: Run tests
     run: bun test
   ```

3. スナップショットテスト
   - コンポーネントの出力検証
   - エラーメッセージの検証
   - 多言語出力の検証

#### 次のステップ

1. テストケース作成
   - コンポーネントテスト
   - ユーティリティテスト
   - エラーケーステスト

2. CI/CD設定
   - GitHub Actions設定
   - テストレポート出力
   - カバレッジレポート

3. テスト自動化
   - watch modeの活用
   - 自動再実行の設定
   - テストフィルタリング

### 2024-03-XX: テスト環境の整備 - Phase 2

#### 完了した実装

1. テスト環境の構築
   - Bunテストランナーの導入
   - JSDOMによるDOMシミュレーション
   - React Testing Libraryの設定

2. ユニットテストの実装
   ```typescript
   // ユーティリティ関数のテスト
   - i18n.test.ts: メッセージ取得機能
   - transfer.test.ts: エラーハンドリング
   
   // コンポーネントのテスト
   - KyokuList.test.tsx: レンダリングと選択機能
   ```

3. テスト戦略の決定
   - ユニットテストに焦点を当てる
   - Chrome APIに依存する部分は分離
   - DOMテストにJSDOMを使用

#### 意思決定のポイント

1. テストツールの選択
   - Bunテストランナー: 高速な実行と簡単な設定
   - JSDOM: React Testing Libraryとの相性
   - モックの簡素化: Chrome API依存を最小限に

2. テストスコープ
   - ユニットテストを優先
   - E2Eテストは後続フェーズで検討
   - Chrome API依存部分は分離して管理

#### 次のステップ

1. コンポーネントテストの拡充
   ```typescript
   // 優先順位の高いテスト
   - NAGAPanel.test.tsx
   - ErrorDisplay.test.tsx
   - i18n機能の統合テスト
   ```

2. エラーハンドリングの実装
   - エラー表示コンポーネント
   - エラー状態の管理
   - ユーザーフレンドリーなメッセージ

3. 残りのコンポーネント実装
   - mjai-reviewerパネル
   - 統計データ表示
   - 設定画面

[参考]
- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### 2024-03-XX: マニフェスト設定の最適化

#### 完了した修正
1. manifest.tsの削除
   - package.jsonでのmanifest設定に移行
   - 設定の一元管理
   - Plasmoの推奨方法に準拠

2. Content Script設定の整理
   ```json
   {
     "content_scripts": [
       {
         "matches": ["https://naga.dmv.nico/naga_report/order_form/*"],
         "js": ["src/contents/naga.ts"]
       }
     ]
   }
   ```

#### 次のステップ
1. NAGAパネルのテスト実装
   - レンダリングテスト
   - 転送機能のテスト
   - エラーケースのテスト

2. エラー表示コンポーネントの実装
   - エラーメッセージの表示
   - 多言語対応
   - スタイリング

3. mjai-reviewerパネルの実装
   - 基本構造
   - プレイヤー選択機能
   - 転送機能

### 2024-03-XX: NAGAパネルのテスト実装

#### 完了した実装

1. NAGAパネルのテストケース
   ```typescript
   // 基本的なレンダリングテスト
   test("renders panel correctly", () => {
     expect(getByTestId("naga-title")).toBeDefined()
     expect(getByText("プレビュー")).toBeDefined()
     expect(getByTestId("transfer-button")).toBeDefined()
   })

   // 転送機能のテスト
   test("handles transfer click", () => {
     const mockTransfer = mock(() => {})
     fireEvent.click(transferButton)
     expect(mockTransfer).toHaveBeenCalledTimes(1)
   })
   ```

2. テスト環境の改善
   - JSDOMによるDOM環境のセットアップ
   - テストIDを使用した要素の特定
   - クリーンアップ処理の追加

3. コンポーネントの改善
   - data-testid属性の追加
   - アクセシビリティの向上
   - 多言語対応のテスト

#### 次のステップ

1. エラー表示コンポーネントの実装
   ```typescript
   interface ErrorDisplayProps {
     message: string
     onClose?: () => void
   }
   ```

2. mjai-reviewerパネルの実装
   - プレイヤー選択機能
   - URL生成機能
   - 転送処理

3. 統合テストの追加
   - エラーハンドリングのテスト
   - 多言語切り替えのテスト
   - 状態管理のテスト

[参考]
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)

### 2024-03-XX: Plasmoライブラリへの移行 - Phase 1

#### 完了した実装

1. @plasmohq/storage への移行
   - `chrome.storage.local`から`Storage`クラスへの移行
   - 型安全な保存と取得の実装
   ```typescript
   const storage = new Storage()
   const [storedLang, storedData] = await Promise.all([
     storage.get("DisplayLang"),
     storage.get("toNagaData")
   ])
   ```

2. @plasmohq/messaging への移行
   - メッセージングシステムの再構築
   - 型安全なリクエスト/レスポンス処理
   ```typescript
   export type TransferResponse = {
     success: boolean
     error?: string
   }
   
   export type TransferRequest = {
     data: NagaData
   }
   ```

3. エラーハンドリングの簡素化
   - カスタムエラークラスの削除
   - シンプルなエラーメッセージ管理への移行
   - Content Script側のエラー処理の改善

#### 変更点の詳細

1. `popup.tsx`の変更
   - Storageクラスの導入
   - エラーハンドリングの簡素化
   - 型キャストの適切な実装

2. `transfer.ts`の変更
   - Plasmoメッセージングの実装
   - タブ管理とContent Script通信の統合
   - エラー処理の統一化

3. `naga.ts`の変更
   - カスタムエラーの削除
   - シンプルなエラー処理への移行
   - メッセージハンドリングの改善

#### 次のステップ

1. 残りのContent Scriptの移行
   - mjai-reviewer関連の実装
   - 統計データ処理の実装

2. テスト実装
   - Storage操作のテスト
   - メッセージング処理のテスト
   - エラーケースのテスト

3. ドキュメント更新
   - 新しい実装の説明追加
   - 移行手順の記録
   - APIリファレンスの更新

[参考]
- [@plasmohq/storage Documentation](https://docs.plasmo.com/framework/storage)
- [@plasmohq/messaging Documentation](https://docs.plasmo.com/framework/messaging)
