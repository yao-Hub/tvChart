import { PageEnum } from "@/constants/pageEnum";
import { useUser } from "@/store/modules/user";
import type { Router } from "vue-router";

export function createPermissionGuard(router: Router) {
  const userStore = useUser();
  router.beforeEach(async (to) => {
    if (to.meta.passGuard) {
      return true;
    }
    // 检查是否是游客登录
    const ifGuest = useUser().checkIfGuest();
    if (ifGuest) {
      return true;
    }
    // 检查是否登录
    const token = userStore.getToken();
    // 不是login页面并且没有token 跳转login
    if (!ifGuest && !to.path.includes(PageEnum.LOGIN) && !token) {
      await router.replace({ path: PageEnum.LOGIN });
      return false;
    }
  });
}
