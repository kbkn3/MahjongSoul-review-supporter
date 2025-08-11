import { defineConfig } from 'wxt'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // WXTのデフォルト構造を使用（entrypoints/, assets/, utils/, components/）
  
  // パブリックディレクトリを指定（_localesなど）
  publicDir: 'public',
  
  // 拡張機能のマニフェスト設定
  manifest: {
    name: "__MSG_appName__",
    version: "1.3.1",
    description: "__MSG_appDesc__",
    author: "kbkn",
    default_locale: "en",
    permissions: ["storage"],
    host_permissions: [
      "https://game.mahjongsoul.com/*",
      "https://mahjongsoul.game.yo-star.com/*",
      "https://game.maj-soul.net/*",
      "https://game.maj-soul.com/*",
      "https://naga.dmv.nico/naga_report/order_form/",
      "https://mjai.ekyu.moe/"
    ],
    web_accessible_resources: [
      {
        resources: ["mahjongDataParser.js"],
        matches: [
          "https://game.mahjongsoul.com/*",
          "https://mahjongsoul.game.yo-star.com/*",
          "https://game.maj-soul.net/*",
          "https://game.maj-soul.com/*"
        ]
      }
    ]
  },
  
  // ビルド出力ディレクトリ
  outDir: 'dist-wxt',
  
  // 開発モードの設定
  dev: {
    server: {
      port: 3000
    },
    // ブラウザの自動起動は開発時に手動で対応
    // リロード戦略
    reloadCommand: 'Alt+Shift+Ext+R'
  },
  
  // Vite設定のカスタマイズ
  vite: () => ({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './')
      }
    }
  }),
  
  // 自動import設定
  imports: {
    // WXTのデフォルト自動importを使用
    // ブラウザAPIやutils、componentsディレクトリから自動import
  },
  
  // TypeScript対応
  // WXTはデフォルトでTypeScriptをサポート
})