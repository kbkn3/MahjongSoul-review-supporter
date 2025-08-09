import { createApp } from 'vue'
import App from '../../components/options/App.vue'
import '../../public/index.css'

// WXTでのOptionsページ初期化
const app = createApp(App)
app.mount('#app')

console.log('WXT Options page initialized')