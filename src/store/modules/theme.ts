import { useDark, useToggle } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useChartInit } from "./chartInit";
import { useStorage } from "./storage";

type TsystemTheme = "light" | "dark"; // 系统主题
type TupDownTheme = "upRedDownGreen" | "upGreenDownRed"; // 涨跌风格

export const useTheme = defineStore("theme", () => {
  const isDark = useDark();
  const toggleDark = useToggle(isDark);

  const systemTheme = ref<TsystemTheme>("dark");
  const upDownTheme = ref<TupDownTheme>("upRedDownGreen");

  watch(
    () => isDark.value,
    () => {
      if (
        (systemTheme.value === "light" && isDark.value) ||
        (systemTheme.value === "dark" && !isDark.value)
      ) {
        initTheme();
        changeChartTheme();
      }
    }
  );

  const getSystemTheme = () => {
    const stoTheme = localStorage.getItem("systemTheme") || "dark";
    systemTheme.value = stoTheme as TsystemTheme;
    document.documentElement.setAttribute("data-theme", systemTheme.value);
    return systemTheme.value;
  };

  const initTheme = () => {
    const stoTheme = localStorage.getItem("systemTheme") || "dark";
    if (
      (stoTheme === "light" && isDark.value) ||
      (stoTheme === "dark" && !isDark.value)
    ) {
      toggleDark();
    }
    systemTheme.value = stoTheme as TsystemTheme;
    document.documentElement.setAttribute("data-theme", systemTheme.value);

    getUpDownTheme();
  };
  const changeSystemTheme = () => {
    toggleDark();
    const theme = systemTheme.value === "dark" ? "light" : "dark";
    systemTheme.value = theme as TsystemTheme;
    document.documentElement.setAttribute("data-theme", systemTheme.value);
    localStorage.setItem("systemTheme", theme);
  };
  const saveChartTheme = (id: string, theme: "light" | "dark") => {
    const themeMap = useStorage().getItem("chartThemeMap") || {};
    themeMap[id] = theme;
    useStorage().setItem("chartThemeMap", themeMap);
  };
  const changeChartTheme = () => {
    useChartInit().state.chartWidgetList.forEach((item) => {
      item.widget?.changeTheme(systemTheme.value);
      saveChartTheme(item.id, systemTheme.value);
    });
  };
  const getUpDownTheme = () => {
    const type = localStorage.getItem("upDownTheme") as TupDownTheme;
    if (type) {
      upDownTheme.value = type;
    }
    return upDownTheme.value;
  };
  const setUpDownTheme = (type?: TupDownTheme) => {
    if (type) {
      upDownTheme.value = type;
    }
    document.documentElement.setAttribute("upDown-theme", upDownTheme.value);
    localStorage.setItem("upDownTheme", upDownTheme.value);
    const chartInitStore = useChartInit();

    const red = "#F53058";
    const green = "#2E9C76";
    const lightRed = "rgba(242, 54, 69, 0.5)";
    const lightGreen = "rgba(8, 153, 129, 0.5)";
    const proRed = "#f5a6ae";
    const proGreen = "#a9dcc3";

    const downColor = upDownTheme.value === "upRedDownGreen" ? green : red;
    const upColor = upDownTheme.value === "upRedDownGreen" ? red : green;

    const upLightColor =
      upDownTheme.value === "upRedDownGreen" ? lightGreen : lightRed;
    const downLightColor =
      upDownTheme.value === "upRedDownGreen" ? lightGreen : lightRed;

    const upProjectionColor =
      upDownTheme.value === "upRedDownGreen" ? proGreen : proRed;
    const downProjectionColor =
      upDownTheme.value === "upRedDownGreen" ? proRed : proGreen;

    try {
      chartInitStore.state.chartWidgetList.forEach((item) => {
        item.widget!.applyOverrides({
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
    } catch (error) {}
  };

  function $reset() {}
  return {
    systemTheme,
    upDownTheme,
    initTheme,
    changeSystemTheme,
    changeChartTheme,
    getUpDownTheme,
    setUpDownTheme,
    getSystemTheme,
    saveChartTheme,
    $reset,
  };
});
