<template>
  <el-dropdown-menu>
    <el-dropdown-item>
      <div class="colorsItem" @click="changeColor('upRedDownGreen')">
        <img class="logo" src="@/assets/icons/upRedDownGreen.svg" />
        <span>{{ $t("upRedDownGreen") }}</span>
        <img
          class="logo checkIcon"
          src="@/assets/icons/select.svg"
          v-if="themeStore.upDownTheme === 'upRedDownGreen'"
        />
      </div>
    </el-dropdown-item>
    <el-dropdown-item>
      <div class="colorsItem" @click="changeColor('upGreenDownRed')">
        <img class="logo" src="@/assets/icons/upGreenDownRed.svg" />
        <span>{{ $t("upGreenDownRed") }}</span>
        <img
          class="logo checkIcon"
          src="@/assets/icons/select.svg"
          v-if="themeStore.upDownTheme === 'upGreenDownRed'"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
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
  width: 150px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
}
.checkIcon {
  margin-left: auto;
}
</style>
