import { PageEnum } from "@/constants/pageEnum";
import type { RouteRecordRaw } from "vue-router";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: PageEnum.PROTOCOL,
    name: "protocol",
    component: () => import("@/views/protocol.vue"),
    meta: {
      passGuard: true,
    },
  },
];

export default routes;
