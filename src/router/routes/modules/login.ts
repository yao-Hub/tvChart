import type { RouteRecordRaw } from 'vue-router'

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      passGuard: true
    },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/login/register.vue'),
    meta: {
      passGuard: true
    },
  },
  {
    path: '/resetPassword',
    name: 'resetPassword',
    component: () => import('@/views/login/resetPassword.vue'),
    meta: {
      passGuard: true
    },
  },
]

export default routes
