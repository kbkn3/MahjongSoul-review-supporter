import { createApp } from 'vue'
import App from '../../src/options/App.vue'
import '../../src/index.css'

// WXTでのOptionsページ初期化
const app = createApp(App)
app.mount('#app')

console.log('WXT Options page initialized')