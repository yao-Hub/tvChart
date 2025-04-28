<template>
  <el-dropdown-menu>
    <el-dropdown-item>
      <div class="colorsItem" @click="changeColor('upRedDownGreen')">
        <BaseImg class="logo" iconName="upRedDownGreen" />
        <span>{{ t("upRedDownGreen") }}</span>
        <BaseImg
          class="logo checkIcon"
          iconName="select"
          v-if="themeStore.upDownTheme === 'upRedDownGreen'"
        />
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="colorsItem" @click="changeColor('upGreenDownRed')">
        <BaseImg class="logo" iconName="upGreenDownRed" />
        <span>{{ t("upGreenDownRed") }}</span>
        <BaseImg
          class="logo checkIcon"
          iconName="select"
          v-if="themeStore.upDownTheme === 'upGreenDownRed'"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();

const emit = defineEmits(["closeDropdown"]);

const changeColor = (theme: "upRedDownGreen" | "upGreenDownRed") => {
  emit("closeDropdown");
  themeStore.setUpDownTheme(theme);
};
</script>

<style lang="scss" scoped>
.colorsItem {
  min-width: 150px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
}
.checkIcon {
  margin-left: auto;
}
</style>
