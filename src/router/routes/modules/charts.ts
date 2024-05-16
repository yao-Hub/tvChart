import type { RouteRecordRaw } from 'vue-router'

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: '/chart',
    name: 'chart',
    component: () => import('@/views/chart/index.vue')
  },
]

export default routes
