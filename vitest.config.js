import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// テスト専用のVite設定
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
        'dist-wxt/**',
        'entrypoints/injected/**',
        'entrypoints/*/main.ts',
        'archive/**',
        '.wxt/**',
        'coverage/**',
        '**/*.d.ts',
        'scripts/dist/**',
        'wxt.config.ts',
        'eslint.config.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~': path.resolve(__dirname, './'),
    },
  },
  define: {
    // テスト環境用の設定
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __DEV__: true
  }
})