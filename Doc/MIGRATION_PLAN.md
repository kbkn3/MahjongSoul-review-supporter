# Chrome Extension v1 から Plasmo/React への移行計画

## 現行システム (v1) の要件

### 機能要件

1. 基本機能
   - [x] 雀魂の牌譜データの取得と変換
     - 天鳳形式への変換
     - Akochan Reviewer形式への変換
     - 統計データ形式への変換
   - [x] 外部サービスとの連携
     - NAGAへの牌譜データ自動転送
     - mjai-reviewer (Mortal/Akochan)への牌譜データ自動転送
   - [x] 牌譜データの統計表示
     - 和了、放銃、立直等の基本統計
     - テキスト形式での出力（Excel/スプレッドシート対応）

2. UI/UX要件
   - [x] ポップアップUI
     - NAGA転送セクション（局選択機能付き）
     - Mortal/Akochan転送セクション（プレイヤー選択機能付き）
     - 統計データ表示セクション
   - [x] 多言語対応
     - 日本語
     - 英語
     - 中国語（簡体字/繁体字）
   - [x] サーバー設定
     - 日本語サーバー (game.mahjongsoul.com)
     - 英語/国際サーバー (mahjongsoul.game.yo-star.com)
     - 中国語サーバー (game.maj-soul.net/game.maj-soul.com)

3. パーミッション
   - [x] Chrome Extension パーミッション
     - storage: 設定とデータの保存
     - host_permissions: 雀魂関連ドメイン
     - web_accessible_resources: スクリプトリソース
   - [x] アクセスAPI
     - Chrome Storage API
     - 雀魂ゲームAPI（牌譜データ取得）
     - NAGA API（牌譜解析）
     - mjai-reviewer API（牌譜解析）

### 技術仕様

1. アーキテクチャ
   - Background Script の役割
     - インストール時の初期設定（言語設定）
     - オプションページの管理
   - Content Script の役割
     - 雀魂サイトでの牌譜データ取得
     - NAGA/mjai-reviewerサイトでの自動入力
   - Popup の実装
     - Vue.jsベースのUI
     - 3つの主要コンポーネント（NAGA/Mjai/Recipe）

2. 使用API
   a. Chrome Extension API
      - `chrome.runtime`
        - メッセージング（background/content/popup間）
        - インストールイベント処理
      - `chrome.storage.local`
        - 言語設定の保存（MSLang, DisplayLang）
        - 一時データの保存（toNagaData, toMjaiData）
      - `chrome.tabs`
        - 新規タブの作成
        - アクティブタブの操作

   b. 外部サービスAPI
      - 雀魂API
        - 牌譜データの取得（WebSocket経由）
        - サーバー別エンドポイント:
          - `game.mahjongsoul.com`
          - `mahjongsoul.game.yo-star.com`
          - `game.maj-soul.net`
          - `game.maj-soul.com`

      - NAGA API
        - エンドポイント: `naga.dmv.nico/naga_report/order_form/`
        - 牌譜データの自動入力

      - mjai-reviewer API
        - エンドポイント: `mjai.ekyu.moe`
        - 多言語エンドポイント:
          - 日本語: `/ja.html`
          - 英語: `/`
          - 中国語: `/zh-cn.html`

3. データフロー
   a. データの保存方法
      - Chrome Storage Local API
        - 設定データ
          - `MSLang`: サーバー言語設定（0: 日本語, 1: 英語, 2: 中国語）
          - `DisplayLang`: UI表示言語設定（0: 日本語, 1: 英語, 2: 中国語）
          - `rule`: ルール設定
        - 一時データ
          - `toNagaData`: NAGA解析用の変換済み牌譜データ
          - `toMjaiData`: mjai-reviewer用のURL
          - `toMjaiData_no`: プレイヤー選択番号

   b. データ変換フロー
      1. 牌譜データの取得と変換
         - WebSocketから雀魂の牌譜データを取得
         - 各形式に変換
           - 天鳳形式 (`generatelog`関数)
           - NAGA形式 (`soul2naga`関数)
           - 統計データ形式 (`processData`関数)

      2. データの受け渡し
         - Content Script → Background → Popup
           - `chrome.runtime.sendMessage`でデータ転送
           - `chrome.runtime.onMessage.addListener`でデータ受信

      3. 外部サービスへの転送
         - NAGA
           - Storage経由で変換済みデータを保存
           - 自動入力用スクリプトで転送
         - mjai-reviewer
           - URLとプレイヤー番号をStorage経由で保存
           - 自動入力用スクリプトで転送

   c. 状態管理
      - Vue.jsのReactive System
        - `ref`: 単一の値（`TableText`, `DisplayLang`等）
        - `reactive`: 配列やオブジェクト（`Kyoku_info`, `seki`等）
      - Chrome Storageとの同期
        - 設定値の永続化
        - タブ間でのデータ共有

## Plasmo/React 移行計画

### 技術スタック

- Plasmo Framework
- React
- TypeScript
- その他必要なライブラリ

### 移行ステップ

1. 準備フェーズ
   - [ ] Plasmoプロジェクトの初期設定
   - [ ] 必要なパッケージのインストール
   - [ ] TypeScript設定

2. 実装フェーズ
   - [ ] コンポーネントの移行
   - [ ] ロジックの移行
   - [ ] 状態管理の実装

3. テストフェーズ
   - [ ] 単体テスト
   - [ ] E2Eテスト
   - [ ] クロスブラウザテスト

### タイムライン

- フェーズ1: 準備 (X日)
- フェーズ2: 実装 (Y日)
- フェーズ3: テスト (Z日)

## 注意点

- 既存のデータ移行について
- 後方互換性の考慮
- パフォーマンスの最適化

## 参考リソース

- [Plasmo Documentation](https://docs.plasmo.com/)
- [React Documentation](https://react.dev/)

### UI/UX詳細仕様

1. ポップアップインターフェース
   a. 共通UI要素
      - テンプレートボックス（.template-box）
      - タイトルヘッダー（.template-title）
      - 多言語テキスト表示
        - 説明文（description配列）
        - カラム名（descriptionColumn配列）
      - レスポンシブテキストサイズ（text-xs）

   b. NAGA転送セクション
      - 局選択機能
        - 各局の情報表示（Kyoku_info配列）
        - 選択状態の管理（isSelect）
      - 天鳳形式への変換プレビュー
      - 自動転送ボタン
      - エラー通知機能

   c. mjai-reviewer転送セクション
      - プレイヤー選択機能（seki配列）
      - サーバー別URL管理
        - 日本語: game.mahjongsoul.com
        - 英語: mahjongsoul.game.yo-star.com
        - 中国語: game.maj-soul.net
      - 言語別エンドポイント自動選択
      - 転送状態表示

   d. 統計データ表示セクション
      - タブ形式のデータ表示
      - コピー可能なテキストエリア
      - Excel/スプレッドシート互換フォーマット
      - 多言語カラムヘッダー

2. インタラクション設計
   a. データ取得フロー
      - ページロード時の自動データ取得
      - エラー時のリロード促進
      - 読み込み状態の表示

   b. ユーザーアクション
      - 局選択のトグル機能
      - プレイヤー選択のワンクリック転送
      - テキストデータの簡単コピー
      - 言語切替による即時UI更新

   c. エラーハンドリング
      - データ取得失敗時のアラート表示
      - 無効なデータの自動フィルタリング
      - 特殊文字の自動エスケープ処理

3. アクセシビリティ
   - 多言語対応（日本語/英語/中国語）
   - ハイコントラストなテキスト表示
   - 直感的な操作フロー
   - コピー&ペースト機能の最適化

4. パフォーマンス考慮
   - 必要に応じたデータ取得
   - 効率的なデータ変換処理
   - 最小限のDOM更新
   - レスポンシブな表示制御

### 特別な要件と制約

1. セキュリティ要件
   a. コンテンツセキュリティ
      - WebSocketによる安全な通信
      - クロスオリジン制約への対応
        - `web_accessible_resources`による適切なリソース公開
        - 許可されたドメインのみとの通信

   b. データ保護
      - 特殊文字のエスケープ処理

        ```javascript
        name[s] = name[s].replace(/[!#<>"%&$*]/gi, 
          function (s) { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0) });
        ```

      - ローカルストレージでの安全なデータ保存

2. 互換性要件
   a. ブラウザ対応
      - Chrome Web Store対応
      - Edge Web Store対応
      - Manifest V3準拠

   b. サーバー互換性
      - 複数の雀魂サーバー対応
        - 日本語サーバー
        - 英語/国際サーバー
        - 中国語サーバー（簡体字/繁体字）
      - 各サーバーの仕様差異への対応

3. パフォーマンス制約
   a. データ処理
      - 大量の牌譜データの効率的な処理
      - メモリ使用量の最適化
      - 変換処理の非同期実行

   b. UI応答性
      - ポップアップUIの即時表示
      - データ更新時の画面描画最適化
      - 言語切替時の瞬時反映

4. 拡張機能の制約
   a. 権限制限
      - 必要最小限のパーミッション要求
        - storage
        - 特定ドメインへのhost_permissions
      - Content Scriptの実行範囲制限

   b. リソース制限
      - バックグラウンドスクリプトの制限
      - ポップアップウィンドウのサイズ制限
      - ローカルストレージの容量制限

5. 外部サービス連携の制約
   a. NAGA連携
      - 天鳳形式への正確な変換
      - 自動入力時のタイミング制御
      - エラー発生時のリカバリー

   b. mjai-reviewer連携
      - 適切なプレイヤー情報の受け渡し
      - 言語設定に応じたエンドポイント選択
      - データ形式の厳密な準拠

6. メンテナンス要件
   a. コード管理
      - Apache-2.0ライセンスへの準拠
      - 外部ライブラリの適切な管理
      - ソースコードの可読性維持

   b. 更新対応
      - 雀魂APIの仕様変更への追従
      - 外部サービスの更新対応
      - ブラウザバージョンアップへの対応
