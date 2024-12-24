import { PageEnum } from "@/constants/pageEnum";
import type { RouteRecordRaw } from "vue-router";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: PageEnum.LOGIN,
    component: () => import("@/views/login/index.vue"),
    redirect: PageEnum.LOGIN_ACCOUNTS,
    children: [
      {
        path: PageEnum.LOGIN_ACCOUNTS,
        meta: { depth: 1 },
        component: () => import("@/views/login/components/Accounts.vue"),
      },
      {
        path: PageEnum.LOGIN_HOME,
        meta: { depth: 2 },
        component: () => import("@/views/login/components/Login.vue"),
      },
      {
        path: PageEnum.LOGIN_FORGETPASSWORD,
        meta: { depth: 3 },
        component: () => import("@/views/login/components/ForgetPassword.vue"),
      },
      {
        path: PageEnum.LOGIN_REGISTER,
        meta: { depth: 3 },
        component: () => import("@/views/login/components/Register.vue"),
      },
    ],
  },
];

export default routes;
