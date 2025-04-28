import type { RouteRecordRaw } from "vue-router";

import { PageEnum } from "@/constants/pageEnum";

import Accounts from "@/views/login/components/Accounts.vue";
import ForgetPassword from "@/views/login/components/ForgetPassword.vue";
import Login from "@/views/login/components/Login.vue";
import Register from "@/views/login/components/Register.vue";
import Main from "@/views/login/index.vue";

// 路由规则
const routes: RouteRecordRaw[] = [
  {
    path: PageEnum.LOGIN,
    component: Main,
    redirect: PageEnum.LOGIN_ACCOUNTS,
    children: [
      {
        path: PageEnum.LOGIN_ACCOUNTS,
        meta: { depth: 1 },
        component: Accounts,
      },
      {
        path: PageEnum.LOGIN_HOME,
        meta: { depth: 2 },
        component: Login,
      },
      {
        path: PageEnum.LOGIN_FORGETPASSWORD,
        name: "ForgetPassword",
        meta: { depth: 3 },
        component: ForgetPassword,
      },
      {
        path: PageEnum.LOGIN_REGISTER,
        name: "Register",
        meta: { depth: 3 },
        component: Register,
      },
    ],
  },
];

export default routes;
