import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import type { Router } from "vue-router";
import { PageEnum } from "@/constants/pageEnum";

export function createPermissionGuard(router: Router) {
  const userStore = useUser();
  const versionStore = useVersion();
  versionStore.checkVersion();
  router.beforeEach(async (to) => {
    if (to.meta.passGuard) {
      return true;
    }
    const token = userStore.getToken();
    if (to.path !== PageEnum.LOGIN && !token) {
      await router.replace({ path: PageEnum.LOGIN });
      return false;
    }
    if (to.path === PageEnum.LOGIN && token) {
      await router.replace(PageEnum.CHART);
      return false;
    }
  });
}
