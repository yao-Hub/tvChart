import { defineStore } from "pinia";
import { theme } from "ant-design-vue";
import { useChartInit } from "./chartInit";

interface State {
  currentTheme: string;
}

export const useTheme = defineStore("theme", {
  state: (): State => {
    return {
      currentTheme: "dark",
    };
  },
  getters: {
    antDTheme: (state) => {
      window.document.documentElement.setAttribute(
        "data-theme",
        state.currentTheme
      );
      if (state.currentTheme === "dark") {
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
    getTheme() {
      const chartInitStore = useChartInit();
      const theme = window.localStorage.getItem("Theme") || "light";
      this.currentTheme = theme;
      chartInitStore.chartWidgetList.forEach((item) => {
        item.widget?.changeTheme(theme as "light" | "dark");
      });
      return theme;
    },
    setTheme(theme: string) {
      this.currentTheme = theme;
      window.localStorage.setItem("Theme", theme);
      const chartInitStore = useChartInit();
      chartInitStore.chartWidgetList.forEach((item) => {
        item.widget?.changeTheme(theme as "light" | "dark");
      });
    },
  },
});
