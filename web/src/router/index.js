import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  {
    path: '/login/password',
    name: 'loginPassword',
    component: () => import('@/views/LoginPasswordView.vue')
  },
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  {
    path: '/shops',
    name: 'shopList',
    component: () => import('@/views/ShopListView.vue')
  },
  {
    path: '/shops/:id',
    name: 'shopDetail',
    component: () => import('@/views/ShopDetailView.vue')
  },
  {
    path: '/blogs/:id',
    name: 'blogDetail',
    component: () => import('@/views/BlogDetailView.vue')
  },
  {
    path: '/blogs/edit',
    name: 'blogEdit',
    component: () => import('@/views/BlogEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/me',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/me/edit',
    name: 'profileEdit',
    component: () => import('@/views/ProfileEditView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/users/:id',
    name: 'otherInfo',
    component: () => import('@/views/OtherInfoView.vue')
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 守卫只挡"本地无 token"；token 在 Redis 侧失效由 axios 401 拦截兜底
router.beforeEach((to) => {
  const store = useUserStore()
  if (to.meta.requiresAuth && !store.token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
