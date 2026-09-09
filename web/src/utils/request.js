import axios from 'axios'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { useUserStore } from '@/stores/user'

// router 实例由 main.js 注入，避免 request <-> router 循环依赖
let routerRef = null
export function setRouter(router) {
  routerRef = router
}

const service = axios.create({
  baseURL: '/api',
  timeout: 10000
})

service.interceptors.request.use((config) => {
  const token = useUserStore().token
  if (token) config.headers.authorization = token
  return config
})

service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 后端统一响应体 Result { success, errorMsg, data, total }
    if (res && typeof res === 'object' && 'success' in res) {
      if (res.success) return res
      ElMessage.error(res.errorMsg || '操作失败')
      return Promise.reject(new Error(res.errorMsg || '操作失败'))
    }
    return res
  },
  (error) => {
    const status = error.response && error.response.status
    if (status === 401) {
      const store = useUserStore()
      store.clear()
      const current = routerRef && routerRef.currentRoute
      const redirect = current ? current.fullPath : ''
      if (routerRef && current && current.path !== '/login') {
        routerRef.replace({ path: '/login', query: { redirect } })
      }
      return Promise.reject(new Error('请先登录'))
    }
    ElMessage.error(status ? '服务器异常' : '网络异常，请检查后端是否启动')
    return Promise.reject(error)
  }
)

export default service
