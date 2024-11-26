<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="nowColor">
      <div class="nowColor_left">
        <img class="logo" src="@/assets/icons/icon_14.svg" />
        <span>{{ $t("updownColor") }}</span>
      </div>
      <div class="nowColor_right">
        <img
          class="logo checkIcon"
          :src="`src/assets/icons/${themeStore.upDownTheme}.svg`"
        />
        <img class="logo" src="@/assets/icons/turnRight.svg" />
      </div>
    </div>
    <template #dropdown>
      <Colors></Colors>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import Colors from "./Colors.vue";
import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();
</script>

<style lang="scss" scoped>
.nowColor {
  display: flex;
  justify-content: space-between;
  width: 200px;
  height: 32px;

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
