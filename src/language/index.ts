import { createI18n } from "vue-i18n";
import zh from "./locales/zh-CN";
import en from "./locales/en-US";

let language = localStorage.getItem("language") || navigator.language.toLowerCase();; //  获取本地存储 || 根据浏览器语言设置

const i18n = createI18n({
  legacy: false, // 使用Composition API，这里必须设置为false
  locale: language.substring(0, 2), // 默认显示语言
  globalInjection: true, // 全局注册$t方法
  messages: { zh, en },
});

export default i18n;
