import { createPinia } from "pinia";
import type { App } from "vue";
import { debouncePlugin, throttlePlugin } from "./plugins";

const store = createPinia();
store.use(debouncePlugin);
store.use(throttlePlugin);

export const setupStore = async (app: App<Element>) => {
  app.use(store);
};

export default store;
