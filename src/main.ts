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
import { initKlineDB } from "@/utils/IndexedDB/klineDatabase";

import { changeElementPlusMessageIcon } from "./utils/ElementPlus";
import plugins from "@/plugins";

const bootstrap = async () => {
  // 初始化adminhttp数据库
  await initAdminHttpDB();

  // 修改ElementPlus的Message组件图标
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

  // 注册ElementPlus的图标组件
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  // 初始化log数据库
  await initLogDB();

  await initKlineDB();

  app.mount("#app");
};

// 启动
bootstrap();
