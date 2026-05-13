import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ContentPanel from '@/components/common/ContentPanel.vue'

export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  app.component('ContentPanel', ContentPanel)
  app.component('content-panel', ContentPanel)
  return { app }
}
