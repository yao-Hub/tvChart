import { defineStore } from "pinia";
import { useChartInit } from "./chartInit";
import { useDark, useToggle } from "@vueuse/core";

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
  actions: {
    initTheme() {
      const stoTheme = localStorage.getItem("systemTheme") || "light";
      const isDark = useDark();
      if (stoTheme === "light" && isDark.value) {
        useToggle(isDark)();
      }
      if (stoTheme === "dark" && !isDark.value) {
        useToggle(isDark)();
      }
      this.systemTheme = stoTheme;
      document.documentElement.setAttribute("data-theme", this.systemTheme);
    },
    changeSystemTheme() {
      const theme = this.systemTheme === "dark" ? "light" : "dark";
      localStorage.setItem("systemTheme", theme);
      this.initTheme();
    },
    setChartTheme() {
      const chartInitStore = useChartInit();
      chartInitStore.chartWidgetList.forEach((item) => {
        item.widget?.changeTheme(this.systemTheme as "light" | "dark");
      });
    },
    getUpDownTheme() {
      const type = localStorage.getItem("upDownTheme") as State["upDownTheme"];
      if (type) {
        this.upDownTheme = type;
      }
      return this.upDownTheme;
    },
    setUpDownTheme(type?: State["upDownTheme"]) {
      if (type) {
        this.upDownTheme = type;
      }
      document.documentElement.setAttribute("upDown-theme", this.upDownTheme);
      localStorage.setItem("upDownTheme", this.upDownTheme);
      const chartInitStore = useChartInit();
      const downColor =
        this.upDownTheme === "upRedDownGreen" ? "#089981" : "#F23645";
      const upColor =
        this.upDownTheme === "upRedDownGreen" ? "#F23645" : "#089981";
      const upLightColor =
        this.upDownTheme === "upRedDownGreen"
          ? "rgba(8, 153, 129, 0.5)"
          : "rgba(242, 54, 69, 0.5)";
      const downLightColor =
        this.upDownTheme === "upRedDownGreen"
          ? "rgba(8, 153, 129, 0.5)"
          : "rgba(242, 54, 69, 0.5)";
      const upProjectionColor =
        this.upDownTheme === "upRedDownGreen" ? "#a9dcc3" : "#f5a6ae";
      const downProjectionColor =
        this.upDownTheme === "upRedDownGreen" ? "#f5a6ae" : "#a9dcc3";

      chartInitStore.chartWidgetList.forEach((item) => {
        item.widget?.applyOverrides({
          "mainSeriesProperties.candleStyle.upColor": upColor,
          "mainSeriesProperties.candleStyle.downColor": downColor,
          "mainSeriesProperties.candleStyle.borderUpColor": upColor,
          "mainSeriesProperties.candleStyle.borderDownColor": downColor,
          "mainSeriesProperties.candleStyle.wickUpColor": upColor,
          "mainSeriesProperties.candleStyle.wickDownColor": downColor,
          "mainSeriesProperties.hollowCandleStyle.upColor": upColor,
          "mainSeriesProperties.hollowCandleStyle.downColor": downColor,
          "mainSeriesProperties.hollowCandleStyle.borderUpColor": upColor,
          "mainSeriesProperties.hollowCandleStyle.borderDownColor": downColor,
          "mainSeriesProperties.hollowCandleStyle.wickUpColor": upColor,
          "mainSeriesProperties.hollowCandleStyle.wickDownColor": downColor,
          "mainSeriesProperties.haStyle.upColor": upColor,
          "mainSeriesProperties.haStyle.downColor": downColor,
          "mainSeriesProperties.haStyle.borderUpColor": upColor,
          "mainSeriesProperties.haStyle.borderDownColor": downColor,
          "mainSeriesProperties.haStyle.wickUpColor": upColor,
          "mainSeriesProperties.haStyle.wickDownColor": downColor,
          "mainSeriesProperties.barStyle.upColor": upColor,
          "mainSeriesProperties.barStyle.downColor": downColor,
          "mainSeriesProperties.columnStyle.upColor": upLightColor,
          "mainSeriesProperties.columnStyle.downColor": downLightColor,
          "mainSeriesProperties.renkoStyle.upColor": upColor,
          "mainSeriesProperties.renkoStyle.downColor": downColor,
          "mainSeriesProperties.renkoStyle.borderUpColor": upColor,
          "mainSeriesProperties.renkoStyle.borderDownColor": downColor,
          "mainSeriesProperties.renkoStyle.wickUpColor": upColor,
          "mainSeriesProperties.renkoStyle.wickDownColor": downColor,
          "mainSeriesProperties.pbStyle.upColor": upColor,
          "mainSeriesProperties.pbStyle.downColor": downColor,
          "mainSeriesProperties.pbStyle.borderUpColor": upColor,
          "mainSeriesProperties.pbStyle.borderDownColor": downColor,
          "mainSeriesProperties.kagiStyle.upColor": upColor,
          "mainSeriesProperties.kagiStyle.downColor": downColor,
          "mainSeriesProperties.pnfStyle.upColor": upColor,
          "mainSeriesProperties.pnfStyle.downColor": downColor,
          "mainSeriesProperties.renkoStyle.upColorProjection":
            upProjectionColor,
          "mainSeriesProperties.renkoStyle.downColorProjection":
            downProjectionColor,
          "mainSeriesProperties.renkoStyle.borderUpColorProjection":
            upProjectionColor,
          "mainSeriesProperties.renkoStyle.borderDownColorProjection":
            downProjectionColor,
          "mainSeriesProperties.pbStyle.upColorProjection": upProjectionColor,
          "mainSeriesProperties.pbStyle.downColorProjection":
            downProjectionColor,
          "mainSeriesProperties.pbStyle.borderUpColorProjection":
            upProjectionColor,
          "mainSeriesProperties.pbStyle.borderDownColorProjection":
            downProjectionColor,
          "mainSeriesProperties.kagiStyle.upColorProjection": upProjectionColor,
          "mainSeriesProperties.kagiStyle.downColorProjection":
            downProjectionColor,
          "mainSeriesProperties.pnfStyle.upColorProjection": upProjectionColor,
          "mainSeriesProperties.pnfStyle.downColorProjection":
            downProjectionColor,
        });
      });
    },
  },
});
