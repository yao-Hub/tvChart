import { createPinia } from "pinia";
import type { App } from "vue";
import { useUser } from "./modules/user";

const store = createPinia();

export const setupStore = async (app: App<Element>) => {
  app.use(store);
  const userStore = useUser();
  userStore.initUser();
};

export default store;
