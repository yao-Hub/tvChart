import i18n from "@/language/index";
import { createApp } from "vue";
import App from "./App.vue";
import { setupRouter } from "./router";
import { setupStore } from "./store";

import "./assets/icons/iconfont/iconfont.css";
import "./styles/common.scss";
import "./styles/element/dark/css-vars.scss";
import "./styles/element/dark/index.scss";
import "./styles/element/index.scss";

import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import ElementPlus from "element-plus";

import { initLogDB } from "@/utils/IndexedDB/logDatabase";
import { initAdminHttpDB } from "@/utils/IndexedDB/adminHttpDatabase";
import { changeElementPlusMessageIcon } from "./utils/ElementPlus";

import plugins from "@/plugins";
const bootstrap = () => {
  changeElementPlusMessageIcon();

  const app = createApp(App);
  // 安装初始化store
  setupStore(app);

  // 安装初始化路由
  setupRouter(app);

  app.use(ElementPlus);

  app.use(i18n);

  plugins.forEach((plugin) => {
    app.use(plugin);
  });

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  app.mount("#app");

  // 初始化log数据库
  initLogDB();
  // 初始化adminhttp数据库
  initAdminHttpDB();
};

// 启动
bootstrap();
