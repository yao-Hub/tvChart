<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="theme in themeList">
      <div class="colorsItem" @click="changeColor(theme.value)">
        <BaseImg class="logo" :iconName="theme.value" noTheme />
        <span>{{ theme.label }}</span>
        <BaseImg
          class="logo checkIcon"
          iconName="select"
          v-if="themeStore.upDownTheme === theme.value"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import eventBus from "utils/eventBus";
import { useTheme, TupDownTheme } from "@/store/modules/theme";

const { t } = useI18n();
const themeStore = useTheme();

const themeList: Array<{ label: string; value: TupDownTheme }> = [
  {
    label: t("updownTheme.upRedDownGreen"),
    value: "upRedDownGreen",
  },
  {
    label: t("updownTheme.upGreenDownRed"),
    value: "upGreenDownRed",
  },
  {
    label: t("updownTheme.classicUpRedDownGreen"),
    value: "classicUpRedDownGreen",
  },
  {
    label: t("updownTheme.classicUpGreenDownRed"),
    value: "classicUpGreenDownRed",
  },
  {
    label: t("updownTheme.CVD1"),
    value: "CVD1",
  },
  {
    label: t("updownTheme.CVD2"),
    value: "CVD2",
  },
];
const changeColor = (theme: TupDownTheme) => {
  themeStore.setUpDownTheme({ type: theme });
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
