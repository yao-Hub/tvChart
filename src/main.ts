import { createApp } from "vue";
import i18n from "@/language/index";
import App from "./App.vue";
import { setupRouter } from "./router";
import { setupStore } from "./store";

import "./styles/common.scss";
import "./assets/icons/iconfont/iconfont.css";
import "./styles/element/index.scss";
import "./styles/element/dark/css-vars.scss";
import "./styles/element/dark/index.scss";

import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const bootstrap = () => {
  const app = createApp(App);
  // 安装初始化store
  setupStore(app);

  // 安装初始化路由
  setupRouter(app);

  app.use(ElementPlus);

  app.use(i18n);

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
  }

  app.mount("#app");
};

// 启动
bootstrap();
