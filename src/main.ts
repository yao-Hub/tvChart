import i18n from "@/language/index";
import { createApp, h } from "vue";
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
import { ElMessage } from "element-plus";

import BaseImg from "@/components/BaseImg/index.vue";

import { initLogDB } from "@/utils/IndexedDB/logDatabase";

import plugins from "@/plugins";
const bootstrap = () => {
  type MessageType = "success" | "warning";

  const MySuccessIcon = h(BaseImg, { iconName: "icon_success" });
  const MyWarningIcon = h(BaseImg, { iconName: "icon_waring" });

  const iconMap: Record<MessageType, ReturnType<typeof h>> = {
    success: MySuccessIcon,
    warning: MyWarningIcon,
  };

  const types: MessageType[] = ["success", "warning"];
  types.forEach((type) => {
    const original = ElMessage[type];
    ElMessage[type] = (options) => {
      if (typeof options === "string") {
        options = { message: options };
      }
      return original({
        ...options,
        icon: iconMap[type],
      });
    };
  });

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
};

// 启动
bootstrap();
