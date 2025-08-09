# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ルール

- やりとりは日本語で行う
- 思考は英語で行う
- ハードコーディング禁止
- t-wadaのTDDを採用する
- Context7を使用して最新のドキュメントを参照する
- 動作確認は`chrome-mcp-server`を使用する

## プロジェクト概要

Mahjong Soul Review Supporter は、雀魂（じゃんたま）の牌譜レビューを支援するChrome/Edge拡張機能です。NAGAやmjai-reviewer（Akochan、Mortal）などのAI分析ツールと連携します。

## 開発コマンド

```bash
# 開発サーバー（自動リロード、ホットリロード）
npx wxt

# 本番ビルド（最適化済み）
npx wxt build

# ZIPファイル作成
npx wxt zip

# Lintチェック
npm run lint

# テスト実行
npm test
```

## アーキテクチャ

### 主要技術スタック
- **WXT**: 現代的な拡張機能開発フレームワーク
- **Vue.js 3**: フロントエンドフレームワーク（Composition API）
- **Vite**: 高速ビルドツール（Webpack から移行）
- **TypeScript**: 型安全な開発環境
- **TailwindCSS**: スタイリング
- **Vitest**: テストフレームワーク
- **Manifest V3**: 拡張機能API

### ディレクトリ構造

- `entrypoints/`: WXTエントリーポイント
  - `background.ts`: サービスワーカー（拡張機能のバックグラウンド処理）
  - `majsoul.content.ts`: 雀魂サイトへの統合
  - `naga.content.ts`: NAGA分析ツール連携
  - `mjai.content.ts`: mjai-reviewer連携
  - `popup/`: 拡張機能ポップアップUI（Vue コンポーネント）
  - `options/`: オプションページ
- `components/`: Vue.jsコンポーネント
- `utils/`: ユーティリティ関数
- `src/utils/`: データ変換ロジック
- `public/_locales/`: 多言語対応（en、ja、zh_CN、zh_TW）
- `wxt.config.ts`: WXT設定ファイル

### 重要な実装詳細

1. **拡張機能の動作フロー**:
   - content scriptが雀魂ページに注入される
   - ゲームデータを取得してTenho形式に変換
   - popup UIから外部分析ツールへのリンクを提供

2. **データ保存**: Chrome Storage APIを使用

3. **開発時のホットリロード**: WXTが自動リロードとホットリロードを提供

### 技術的特徴

- **Node.js 20+**: 最新のNode.js環境で動作
- **Vitest**: テストフレームワーク設定完了（19テスト）
- **TypeScript**: 型安全な開発環境
- **WXT**: ファイルベースルーティングとオートインポート
- **ESLint**: Vue3とWebExtensions環境で設定済み

### パフォーマンス

- **ビルド時間**: Webpack失敗 → WXT 2.4秒（大幅改善）
- **開発体験**: ホットリロードとライブリロード対応
- **ファイルサイズ**: 4.2MB（最適化済み）
