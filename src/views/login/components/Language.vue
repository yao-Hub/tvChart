<template>
  <el-dropdown trigger="hover" placement="bottom-start">
    <div class="downOutner">
      <el-text>{{ languageStore.nowLocale }}</el-text>
      <BaseImg iconName="caretDown" />
    </div>
    <template #dropdown>
      <div class="downInner">
        <div
          class="innerItem"
          v-for="(value, key) in languageStore.localeList"
          @click="languageStore.changeLocale(key)"
        >
          <span>{{ value.nowLocale }}</span>
        </div>
      </div>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useLanguage } from "@/store/modules/language";
const languageStore = useLanguage();
const emit = defineEmits(["change"]);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.downOutner {
  min-width: 144px;
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
  min-width: 144px;
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
