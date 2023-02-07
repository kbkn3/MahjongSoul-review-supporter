import manifest from './src/manifest.config';
import { crx } from '@crxjs/vite-plugin';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@/': `${__dirname}/src/`,
      '~/': `${__dirname}/public/`,
    },
  },
  plugins: [vue(), crx({ manifest })],
})
