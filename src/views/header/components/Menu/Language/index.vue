<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="expandIcon">
      <div class="expandIcon_left">
        <TranslationOutlined />
        <span>{{ $t("lauguage") }}</span>
      </div>
      <div class="expandIcon_right">
        <span>{{ nowLocale }}</span>
        <RightOutlined style="font-size: 12px" />
      </div>
    </div>
    <template #dropdown>
      <Locales></Locales>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RightOutlined, TranslationOutlined } from "@ant-design/icons-vue";
import Locales from "./Locales.vue";
import { useI18n } from "vue-i18n";
const I18n = useI18n();
const nowLocale = computed(() => {
  const { locale, messages } = I18n;
  const localeList = messages.value;
  const curentLocale = locale.value;
  return localeList[curentLocale].nowLocale;
});
</script>

<style lang="scss" scoped>
.expandIcon {
  width: 200px;
  display: flex;
  justify-content: space-between;
  height: 32px;
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