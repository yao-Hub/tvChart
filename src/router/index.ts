import type { App } from "vue";
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from "vue-router";
import { createPermissionGuard } from "./guard/index";
import routes from "./routes/index";
const router = createRouter({
  // vueRouter@3版本的mode改成了history，hash模式配置createWebHashHistory，history模式配置createWebHistory
  // electron使用hash模式
  // @ts-ignore
  history: ELECTRON_PLATFORM ? createWebHashHistory() : createWebHistory(),
  routes,
});

/**
 * 路由初始化函数
 * @param app
 */
export const setupRouter = (app: App<Element>) => {
  createPermissionGuard(router);
  app.use(router);
};

export default router;
