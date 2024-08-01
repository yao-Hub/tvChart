import { useUser } from "@/store/modules/user";
import type { Router } from "vue-router";
import { PageEnum } from "@/constants/pageEnum";

export function createPermissionGuard(router: Router) {
  const userStore = useUser();
  router.beforeEach(async (to) => {
    if (to.meta.passGuard) {
      return true;
    }
    if (to.path !== PageEnum.LOGIN && !userStore.ifLogin) {
      await router.replace({ path: PageEnum.LOGIN });
      return false;
    }
    if (to.path === PageEnum.LOGIN && userStore.ifLogin) {
      await router.replace(PageEnum.CHART);
      return false;
    }
  });
}
