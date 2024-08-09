import { createPinia } from "pinia";
import type { App } from "vue";

const store = createPinia();

export const setupStore = async (app: App<Element>) => {
  app.use(store);
};

export default store;
