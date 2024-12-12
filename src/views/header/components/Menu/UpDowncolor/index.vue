<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="UpdownColor">
      <div class="UpdownColor_left">
        <img class="logo" src="@/assets/icons/icon_14.svg" />
        <span>{{ $t("updownColor") }}</span>
      </div>
      <div class="UpdownColor_right">
        <img
          class="logo checkIcon"
          :src="`src/assets/icons/${themeStore.upDownTheme}.svg`"
        />
        <img class="logo" src="@/assets/icons/turnRight.svg" />
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
