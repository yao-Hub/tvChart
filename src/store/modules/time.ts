import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useChartInit } from "./chartInit";
import { useStorage } from "./storage";

const time = dayjs;

time.extend(utc);
time.extend(timezone);
time.extend(relativeTime);
export const useTime = defineStore("time", () => {
  const I18n = useI18n();
  const value = I18n.locale.value;
  const storageStore = useStorage();
  const chartInitStore = useChartInit();
  const settedTimezone = ref(time.tz.guess());

  const initTime = () => {
    const userTimezone = storageStore.getItem("timezone") || time.tz.guess();
    // 日期语言
    if (value === "en") {
      dayjs.locale("en");
    }
    if (value === "zh") {
      dayjs.locale("zh-cn");
    }
    setTimezone(userTimezone);
  };

  const setTimezone = (value: string) => {
    settedTimezone.value = value;
    time.tz.setDefault(value);
    storageStore.setItem("timezone", value);
    setChartTimezone(value);
  };

  const setChartTimezone = (value: string) => {
    chartInitStore.state.chartWidgetList.forEach((item) => {
      if (item.widget) {
        // @ts-ignore
        item.widget.activeChart().getTimezoneApi().setTimezone(value);
      }
    });
  };

  return {
    time,
    initTime,
    setTimezone,
    settedTimezone,
  };
});
