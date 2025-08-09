import { createApp } from 'vue'
import App from '../../src/popup/App.vue'
import '../../src/index.css'

// WXTでのVueアプリケーション初期化
const app = createApp(App)

// デバッグ用のログ
console.log('WXT Popup initializing...')
console.log('Available elements:', document.body.innerHTML)

// どちらのIDでもマウントできるように修正
const mountPoint = document.getElementById('app') || document.getElementById('amzSchRoot')
if (mountPoint) {
  app.mount(mountPoint)
  console.log('WXT Popup mounted successfully to:', mountPoint.id)
} else {
  console.error('Mount point not found. Available body content:', document.body.innerHTML)
}