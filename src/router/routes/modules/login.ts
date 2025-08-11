import type { RouteRecordRaw } from "vue-router";

import { PageEnum } from "@/constants/pageEnum";

import Accounts from "@/views/login/Accounts.vue";
import ForgetPassword from "@/views/login/ForgetPassword.vue";
import Login from "@/views/login/Login.vue";
import Opt from "@/views/login/Opt.vue";
import Register from "@/views/login/VerifyEmail.vue";
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
        path: PageEnum.LOGIN_OPT,
        meta: { depth: 3 },
        component: Opt,
      },
      {
        path: PageEnum.LOGIN_FORGET_PASSWORD,
        name: "ForgetPassword",
        meta: { depth: 3 },
        component: ForgetPassword,
      },
      {
        path: PageEnum.LOGIN_FORGET_ACCOUNT,
        name: "forgetAccount",
        meta: { depth: 3 },
        component: Register,
      },
      {
        path: PageEnum.LOGIN_REGISTER,
        name: "register",
        meta: { depth: 3 },
        component: Register,
      },
    ],
  },
];

export default routes;
