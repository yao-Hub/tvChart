import { useDark, useToggle } from "@vueuse/core";
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useChartInit } from "./chartInit";
import { useStorage } from "./storage";

type TsystemTheme = "light" | "dark"; // 系统主题
export type TupDownTheme =
  | "upRedDownGreen"
  | "upGreenDownRed"
  | "classicUpRedDownGreen"
  | "classicUpGreenDownRed"
  | "CVD1"
  | "CVD2";

type TUpDownColor = "downColor" | "upColor" | "upHoverColor" | "downHoverColor";

export const useTheme = defineStore("theme", () => {
  const isDark = useDark();
  const toggleDark = useToggle(isDark);

  const systemTheme = ref<TsystemTheme>("dark");
  const upDownTheme = ref<TupDownTheme>("upRedDownGreen");

  const iframesColorScheme = ref<Record<string, TsystemTheme>>({});

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
    window.electronAPI?.invoke("dark-mode:toggle", systemTheme.value);
    getUpDownTheme();
  };
  const changeSystemTheme = () => {
    const theme = systemTheme.value === "dark" ? "light" : "dark";
    systemTheme.value = theme as TsystemTheme;
    document.documentElement.setAttribute("data-theme", systemTheme.value);
    localStorage.setItem("systemTheme", theme);
    toggleDark();

    window.electronAPI?.invoke("dark-mode:toggle", theme);
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

  const getUpDownColor = (colorType: TUpDownColor) => {
    const red = "#F53058";
    const green = "#2E9C76";
    const hoverRed = "#F75173";
    const hoverGreen = "#50AC8C";

    const classisRed = "#EA0071";
    const classisGreen = "#73a600";
    const classisRedHover = "#FF57A8";
    const classisGreenHover = "#ABD252";

    const CVDYellow = "#f4b201";
    const CVDYellowHover = "#FFD051";
    const CVDBlue = "#3067b0";
    const CVDBlueHover = "#5B90D5";

    const colorMap = {
      upRedDownGreen: {
        downColor: green,
        upColor: red,
        upHoverColor: hoverRed,
        downHoverColor: hoverGreen,
      },
      upGreenDownRed: {
        downColor: red,
        upColor: green,
        upHoverColor: hoverGreen,
        downHoverColor: hoverRed,
      },
      classicUpRedDownGreen: {
        downColor: classisGreen,
        upColor: classisRed,
        upHoverColor: classisRedHover,
        downHoverColor: classisGreenHover,
      },
      classicUpGreenDownRed: {
        downColor: classisRed,
        upColor: classisGreen,
        upHoverColor: classisGreenHover,
        downHoverColor: classisRedHover,
      },
      CVD1: {
        downColor: CVDYellow,
        upColor: CVDBlue,
        upHoverColor: CVDBlueHover,
        downHoverColor: CVDYellowHover,
      },
      CVD2: {
        downColor: CVDBlue,
        upColor: CVDYellow,
        upHoverColor: CVDYellowHover,
        downHoverColor: CVDBlueHover,
      },
    };
    return colorMap[upDownTheme.value][colorType];
  };

  const setUpDownTheme = (params?: {
    type?: TupDownTheme;
    chartId?: string;
  }) => {
    if (params && params.type) {
      upDownTheme.value = params.type;
    }
    document.documentElement.setAttribute("upDown-theme", upDownTheme.value);
    localStorage.setItem("upDownTheme", upDownTheme.value);
    const chartInitStore = useChartInit();

    const upColor = getUpDownColor("upColor");
    const downColor = getUpDownColor("downColor");

    const upHoverColor = getUpDownColor("upHoverColor");
    const downHoverColor = getUpDownColor("downHoverColor");

    const overrides = {
      // 正常k线图
      "mainSeriesProperties.candleStyle.upColor": upColor,
      "mainSeriesProperties.candleStyle.downColor": downColor,
      "mainSeriesProperties.candleStyle.borderUpColor": upColor,
      "mainSeriesProperties.candleStyle.borderDownColor": downColor,
      "mainSeriesProperties.candleStyle.wickUpColor": upColor,
      "mainSeriesProperties.candleStyle.wickDownColor": downColor,
      // 空心k线图
      "mainSeriesProperties.hollowCandleStyle.upColor": upColor,
      "mainSeriesProperties.hollowCandleStyle.downColor": downColor,
      "mainSeriesProperties.hollowCandleStyle.borderUpColor": upColor,
      "mainSeriesProperties.hollowCandleStyle.borderDownColor": downColor,
      "mainSeriesProperties.hollowCandleStyle.wickUpColor": upColor,
      "mainSeriesProperties.hollowCandleStyle.wickDownColor": downColor,
      // 美国线
      "mainSeriesProperties.haStyle.upColor": upColor,
      "mainSeriesProperties.haStyle.downColor": downColor,
      "mainSeriesProperties.haStyle.borderUpColor": upColor,
      "mainSeriesProperties.haStyle.borderDownColor": downColor,
      "mainSeriesProperties.haStyle.wickUpColor": upColor,
      "mainSeriesProperties.haStyle.wickDownColor": downColor,
      "mainSeriesProperties.barStyle.upColor": upColor,
      "mainSeriesProperties.barStyle.downColor": downColor,
      // 柱状图
      "mainSeriesProperties.columnStyle.upColor": upColor,
      "mainSeriesProperties.columnStyle.downColor": downColor,
      // HLC区域
      "mainSeriesProperties.hlcAreaStyle.closeLowFillColor": upHoverColor,
      "mainSeriesProperties.hlcAreaStyle.highCloseFillColor": downHoverColor,
      "mainSeriesProperties.hlcAreaStyle.highLineColor": downColor,
      "mainSeriesProperties.hlcAreaStyle.lowLineColor": upColor,
      // 基准线
      "mainSeriesProperties.baselineStyle.bottomFillColor1": downHoverColor,
      "mainSeriesProperties.baselineStyle.bottomFillColor2": downHoverColor,
      "mainSeriesProperties.baselineStyle.bottomLineColor": downColor,
      "mainSeriesProperties.baselineStyle.topFillColor1": upHoverColor,
      "mainSeriesProperties.baselineStyle.topFillColor2": upHoverColor,
      "mainSeriesProperties.baselineStyle.topLineColor": upColor,
    };

    try {
      setTimeout(() => {
        if (params && params.chartId) {
          const target = chartInitStore.state.chartWidgetList.find(
            (e) => e.id === params.chartId
          );
          if (target) {
            target.widget?.applyOverrides(overrides);
            return;
          }
        }

        chartInitStore.state.chartWidgetList.forEach((item) => {
          item.widget?.applyOverrides(overrides);
        });
      });
    } catch (error) {}
  };

  // 获取图表iframe主题
  const getIframesColorScheme = () => {
    const iframes = document.querySelectorAll("iframe");
    iframes.forEach((ifr, index) => {
      const ifrDom = ifr.contentDocument || ifr.contentWindow!.document;
      const htmlDom = ifrDom.querySelector("html");
      if (htmlDom) {
        const htmlStyles = window.getComputedStyle(htmlDom);
        const colorScheme = htmlStyles.colorScheme as TsystemTheme;
        const id = useChartInit().state.chartWidgetList[index].id;
        iframesColorScheme.value[id] = colorScheme;
      }
    });
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
    getIframesColorScheme,
    iframesColorScheme,
    getUpDownColor,
    $reset,
  };
});
