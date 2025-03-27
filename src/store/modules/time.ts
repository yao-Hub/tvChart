import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { CustomTimezoneId, TimezoneId } from "public/charting_library";

import i18n from "@/language/index";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useChartInit } from "./chartInit";
import { useStorage } from "./storage";

export type Ttime = TimezoneId | CustomTimezoneId;

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export const useTime = defineStore("time", () => {
  const storageStore = useStorage();
  const chartInitStore = useChartInit();
  const settedTimezone = ref(dayjs.tz.guess());
  const value = i18n.global.locale.value;

  const initTime = () => {
    const userTimezone = storageStore.getItem("timezone") || "Asia/Shanghai";
    // 日期语言
    if (value === "en") {
      dayjs.locale("en");
    }
    if (value === "zh") {
      dayjs.locale("zh-cn");
    }
    settedTimezone.value = userTimezone;
  };

  const setSystemTimezone = (tz: string) => {
    settedTimezone.value = tz;
    storageStore.setItem("timezone", tz);
    setChartTimezone(tz as Ttime);
  };

  const setChartTimezone = (tz: Ttime) => {
    chartInitStore.state.chartWidgetList.forEach((item) => {
      if (item.widget) {
        item.widget?.activeChart().getTimezoneApi().setTimezone(tz);
      }
    });
  };

  function $reset() {}

  return {
    time: dayjs,
    initTime,
    setSystemTimezone,
    settedTimezone,
    $reset,
  };
});
