import { defineStore } from "pinia";
import { theme } from "ant-design-vue";
import { useChartInit } from "./chartInit";
import { nextTick } from "vue";

interface State {
  systemTheme: string; // 系统主题
  upDownTheme: "upRedDownGreen" | "upGreenDownRed"; // 涨跌风格
}

export const useTheme = defineStore("theme", {
  state: (): State => {
    return {
      systemTheme: "light",
      upDownTheme: "upRedDownGreen",
    };
  },
  getters: {
    antDTheme: (state) => {
      window.document.documentElement.setAttribute(
        "data-theme",
        state.systemTheme
      );
      if (state.systemTheme === "dark") {
        return {
          algorithm: theme.darkAlgorithm,
        };
      }
      return {
        algorithm: theme.compactAlgorithm,
      };
    },
  },
  actions: {
    getSystemTheme() {
      const type = window.localStorage.getItem("systemTheme");
      if (type) {
        this.systemTheme = type;
      }
      return this.systemTheme;
    },
    setSystemTheme(type: string) {
      this.systemTheme = type;
      window.localStorage.setItem("systemTheme", type);
    },
    setChartTheme() {
      const chartInitStore = useChartInit();
      chartInitStore.chartWidgetList.forEach((item) => {
        item.widget?.changeTheme(this.systemTheme as "light" | "dark");
      });
    },
    getUpDownTheme() {
      const type = window.localStorage.getItem(
        "upDownTheme"
      ) as State["upDownTheme"];
      if (type) {
        this.upDownTheme = type;
      }
      return this.upDownTheme;
    },
    setUpDownTheme(type?: State["upDownTheme"]) {
      if (type) {
        this.upDownTheme = type;
      }
      window.document.documentElement.setAttribute("upDown-theme", this.upDownTheme);
    },
  },
});
