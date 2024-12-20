import dayjs from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/zh-cn";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { CustomTimezoneId, TimezoneId } from "public/charting_library";

import { defineStore } from "pinia";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useChartInit } from "./chartInit";
import { useStorage } from "./storage";

export type Ttime = TimezoneId | CustomTimezoneId;

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
    settedTimezone.value = userTimezone;
    time.tz.setDefault(userTimezone);
  };

  const setTimezone = (tz: string) => {
    settedTimezone.value = tz;
    time.tz.setDefault(tz);
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

  return {
    time,
    initTime,
    setTimezone,
    settedTimezone,
  };
});
