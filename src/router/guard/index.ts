import { PageEnum } from "@/constants/pageEnum";
import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import type { Router } from "vue-router";

export function createPermissionGuard(router: Router) {
  const userStore = useUser();
  const versionStore = useVersion();
  versionStore.checkVersion();
  router.beforeEach(async (to) => {
    if (to.meta.passGuard) {
      return true;
    }
    const token = userStore.getToken();
    // 不是login页面并且没有token 跳转login
    if (!to.path.includes(PageEnum.LOGIN) && !token) {
      await router.replace({ path: PageEnum.LOGIN });
      return false;
    }
  });
}
