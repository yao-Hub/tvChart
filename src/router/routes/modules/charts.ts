import type { RouteRecordRaw } from "vue-router";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: "/chart",
    name: "chart",
    component: () => import("@/views/home/index.vue"),
    meta: {
      passGuard: true,
    },
  },
  // {
  //   path: "/test",
  //   name: "test",
  //   component: () => import("@/views/test.vue"),
  //   meta: {
  //     passGuard: true,
  //   },
  // }
];

export default routes;
