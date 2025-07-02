# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ルール

- やりとりは日本語で行う
- 思考は英語で行う

## プロジェクト概要

Mahjong Soul Review Supporter は、雀魂（じゃんたま）の牌譜レビューを支援するChrome/Edge拡張機能です。NAGAやmjai-reviewer（Akochan、Mortal）などのAI分析ツールと連携します。

## 開発コマンド

```bash
# 開発ビルド（自動リロード、ソースマップ付き）
npm run dev

# 本番ビルド（最適化、ZIPファイル作成）
npm run build

# Lintチェック
npm run lint
```

## アーキテクチャ

### 主要技術スタック
- **Vue.js 3**: フロントエンドフレームワーク
- **Webpack**: バンドラー（開発/本番設定分離）
- **TailwindCSS**: スタイリング（PostCSS 7互換版）
- **Manifest V3**: 拡張機能API
- **Socket.io**: 通信ライブラリ

### ディレクトリ構造

- `src/background/`: サービスワーカー（拡張機能のバックグラウンド処理）
- `src/content-scripts/`: 
  - `content_script.js`: 雀魂サイトへの統合
  - `content_script_naga.js`: NAGA分析ツール連携
  - `content_script_mjai.js`: mjai-reviewer連携
- `src/popup/`: 拡張機能ポップアップUI（Vue コンポーネント）
- `src/_locales/`: 多言語対応（en、ja、zh_CN、zh_TW）
- `webpack.dev.js` / `webpack.prod.js`: ビルド設定

### 重要な実装詳細

1. **拡張機能の動作フロー**:
   - content scriptが雀魂ページに注入される
   - ゲームデータを取得してTenho形式に変換
   - popup UIから外部分析ツールへのリンクを提供

2. **データ保存**: Chrome Storage APIを使用

3. **開発時のホットリロード**: `extension-reloader.js`が開発中の自動リロードを実現

### 注意事項

- テストフレームワークは未設定
- Node.js 16を使用（voltaで指定）
  - claudeを動かすためには18が必要
- ESLintはVue3とWebExtensions環境で設定済み