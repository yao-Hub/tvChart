import { PageEnum } from "@/constants/pageEnum";
import { useUser } from "@/store/modules/user";
import { useVersion } from "@/store/modules/version";
import { compact } from "lodash";
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
    if (!to.path.includes(PageEnum.LOGIN) && !token) {
      await router.replace({ path: PageEnum.LOGIN_ACCOUNTS });
      return false;
    }
    const pathList = compact(to.path.substring(1).split("/"));
    const firstPath = pathList[0].toLowerCase();
    if (pathList.length === 1 && firstPath === "login") {
      await router.replace(PageEnum.LOGIN_ACCOUNTS);
      return false;
    }
  });
}
