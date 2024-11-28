import { createPinia } from "pinia";
import type { App } from "vue";
import { debouncePlugin } from "./plugins";

const store = createPinia();
store.use(debouncePlugin);

export const setupStore = async (app: App<Element>) => {
  app.use(store);
};

export default store;
