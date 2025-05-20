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
import eventBus from "utils/eventBus";
import { useTheme } from "@/store/modules/theme";

const { t } = useI18n();
const themeStore = useTheme();
const changeColor = (theme: "upRedDownGreen" | "upGreenDownRed") => {
  themeStore.setUpDownTheme(theme);
  eventBus.emit("closeDropdown");
};
</script>

<style lang="scss" scoped>
.colorsItem {
  min-width: 182px;
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 4px 0;
}
.checkIcon {
  margin-left: auto;
}
</style>
