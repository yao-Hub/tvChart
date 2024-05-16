import { createApp } from 'vue'
import i18n from "@/language/index"
import App from './App.vue'
import { setupRouter } from './router'
import { setupStore } from './store'
import './style.css'
import SingletonSocket from 'utils/socket'

/**
 * 定义启动初始化函数
 */
const bootstrap = () => {
  const app = createApp(App)
  
  app.config.globalProperties.$socket = SingletonSocket.getInstance(import.meta.env.VITE_WEB_SOCKET_URL);

  // 安装初始化store
  setupStore(app)
  
  // 安装初始化路由
  setupRouter(app)
  
  app.use(i18n)
  
  app.mount('#app')
}

// 启动
bootstrap()
