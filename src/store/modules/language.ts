import { defineStore } from "pinia";
import { computed } from "vue";
import i18n from "@/language/index";
import { useRoot } from "../store";
import { useChartInit } from "./chartInit";

export const useLanguage = defineStore("language", () => {
  const { locale, messages } = i18n.global;
  const localeList = messages.value;

  const changeLocale = async (value: "zh" | "en" | "zhTw") => {
    if (value === locale.value) {
      return;
    }
    useChartInit().state.loading = true;
    useChartInit().saveCharts();
    await useRoot().resetAllStore();
    locale.value = value;
    localStorage.setItem("language", value);
  };

  const curentLocale = computed(() => locale.value);

  const nowLocale = computed(() => {
    const curentLocale = locale.value;
    return localeList[curentLocale].nowLocale;
  });

  const t = computed(() => i18n.global.t);

  function $reset() {}

  return { changeLocale, curentLocale, nowLocale, localeList, t, $reset };
});
