import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'
import manifest from './src/manifest.json'

// 拡張機能用のVite設定
export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-vite',
    // CRXJSが自動的に適切なチャンクを生成するため、手動splitChunksは不要
    rollupOptions: {
      input: {
        // マニフェストで定義されているエントリーポイント
        // CRXJSが自動的に検出するため、明示的な定義は必要ないが、
        // カスタマイズが必要な場合は以下のように指定可能
      }
    }
  },
  server: {
    port: 5173,
    // 拡張機能開発用の設定
    hmr: {
      port: 24678
    }
  },
  define: {
    // Vue 3の設定
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    // 開発時のみデバッグモードを有効に
    __DEV__: process.env.NODE_ENV !== 'production'
  }
})