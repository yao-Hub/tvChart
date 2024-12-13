import { PageEnum } from "@/constants/pageEnum";
import type { RouteRecordRaw } from "vue-router";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: PageEnum.CHART,
    name: "chart",
    component: () => import("@/views/home/index.vue"),
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
