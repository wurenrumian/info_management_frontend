/// <reference types="@dcloudio/types" />

interface ImportMetaEnv {
  readonly DEV: boolean
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_PROXY_TARGET: string
  readonly VITE_FILE_PUBLIC_BASE_URL: string
  readonly VITE_WECHAT_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
