import { defineStore } from 'pinia'
import type { UserInfo } from '@/types/user'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>(uni.getStorageSync('token') || '')

  function setToken(newToken: string) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
  }

  return { userInfo, token, setToken, setUserInfo, logout }
})
