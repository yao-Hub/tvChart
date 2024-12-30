<template>
  <el-dropdown trigger="hover" placement="bottom-start">
    <div class="downOutner">
      <el-text>{{ nowLocale }}</el-text>
      <BaseImg iconName="caretDown" />
    </div>
    <template #dropdown>
      <div class="downInner">
        <div
          class="innerItem"
          v-for="(value, key) in localeList"
          @click="changeLocale(key)"
        >
          <span>{{ value.nowLocale }}</span>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from "vue";

import i18n from "@/language/index";
import { useI18n } from "vue-i18n";
const { locale, messages } = useI18n();
const localeList = i18n.global.messages.value;
const changeLocale = (value: string) => {
  if (value === locale.value) {
    return;
  }
  locale.value = value;
  localStorage.setItem("language", value);
  window.location.reload();
};
const nowLocale = computed(() => {
  const localeList = messages.value;
  const curentLocale = locale.value;
  return localeList[curentLocale].nowLocale;
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.downOutner {
  width: 144px;
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-sizing: border-box;
  cursor: pointer;
  &:hover {
    @include background_color("background-hover");
  }
}
.downInner {
  width: 144px;
  border-radius: 4px;
  @include background_color("background");
  .innerItem {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 16px;
    box-sizing: border-box;
    height: 40px;
    cursor: pointer;
    &:hover {
      @include background_color("background-hover");
    }
  }
}
</style>
