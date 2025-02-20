import { createI18n } from "vue-i18n";
import en from "./locales/en-US";
import zh from "./locales/zh-CN";
import zhTw from "./locales/zh-TW";

const language =
  localStorage.getItem("language") || navigator.language.toLowerCase(); //  获取本地存储 || 根据浏览器语言设置

const locale = language.split("-")[0];

const i18n = createI18n({
  legacy: false, // 使用Composition API，这里必须设置为false
  locale, // 默认显示语言
  globalInjection: true, // 全局注册$t方法
  messages: { zh, en, zhTw },
});

export default i18n;
