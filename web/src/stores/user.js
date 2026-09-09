import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as userApi from '@/api/user'

const TOKEN_KEY = 'cn-token'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref(null)

  function setToken(t) {
    token.value = t || ''
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  }

  function clear() {
    setToken('')
    userInfo.value = null
  }

  async function fetchMe(force = false) {
    if (!token.value) return null
    if (userInfo.value && !force) return userInfo.value
    const res = await userApi.getMe()
    userInfo.value = res.data
    return userInfo.value
  }

  function setUserInfo(info) {
    userInfo.value = info
  }

  return { token, userInfo, setToken, clear, fetchMe, setUserInfo }
})
