<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="Language">
      <div class="Language_left">
        <img class="logo" src="@/assets/icons/icon_12.svg" />
        <span>{{ $t("lauguage") }}</span>
      </div>
      <div class="Language_right">
        <el-text type="info">{{ nowLocale }}</el-text>
        <img class="logo" src="@/assets/icons/turnRight.svg" />
      </div>
    </div>
    <template #dropdown>
      <Locales></Locales>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import Locales from "./Locales.vue";
const I18n = useI18n();
const nowLocale = computed(() => {
  const { locale, messages } = I18n;
  const localeList = messages.value;
  const curentLocale = locale.value;
  return localeList[curentLocale].nowLocale;
});
</script>

<style lang="scss" scoped>
.Language {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>
