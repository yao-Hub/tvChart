<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="UpdownColor">
      <div class="UpdownColor_left">
        <BaseImg class="logo" iconName="icon_14" />
        <span>{{ t("updownColor") }}</span>
      </div>
      <div class="UpdownColor_right">
        <BaseImg class="logo checkIcon" :iconName="themeStore.upDownTheme" />
        <BaseImg class="logo" iconName="turnRight" />
      </div>
    </div>
    <template #dropdown>
      <Colors @closeDropdown="emit('closeDropdown')"></Colors>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import Colors from "./Colors.vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const themeStore = useTheme();

const emit = defineEmits(["closeDropdown"]);
</script>

<style lang="scss" scoped>
.UpdownColor {
  display: flex;
  justify-content: space-between;
  width: 200px;
  height: 100%;

  &_left {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  &_right {
    display: flex;
    gap: 5px;
    align-items: center;
  }
}
</style>
