import { PageEnum } from "@/constants/pageEnum";
import type { RouteRecordRaw } from "vue-router";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: PageEnum.LOGIN,
    component: () => import("@/views/login/index.vue"),
    children: [
      {
        path: PageEnum.LOGIN_HOME,
        component: () => import("@/views/login/components/Login.vue"),
      },
      {
        path: PageEnum.LOGIN_ACCOUNTS,
        component: () => import("@/views/login/components/Accounts.vue"),
      },
      {
        path: PageEnum.LOGIN_FORGETPASSWORD,
        component: () => import("@/views/login/components/ForgetPassword.vue"),
      },
      {
        path: PageEnum.LOGIN_REGISTER,
        component: () => import("@/views/login/components/Register.vue"),
      },
    ],
  },
];

export default routes;
