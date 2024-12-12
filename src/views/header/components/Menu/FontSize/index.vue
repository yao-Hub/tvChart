<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="Fontsize">
      <div class="Fontsize_left">
        <img class="logo" src="@/assets/icons/icon_13.svg" />
        <span>{{ $t("font.fontSize") }}</span>
      </div>
      <div class="Fontsize_right">
        <el-text type="info">{{ $t(`font.${sizeStore.systemSize}`) }}</el-text>
        <img class="logo" src="@/assets/icons/turnRight.svg" />
      </div>
    </div>
    <template #dropdown>
      <Sizes @closeDropdown="emit('closeDropdown')"></Sizes>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useSize } from "@/store/modules/size";
import Sizes from "./Sizes.vue";
const sizeStore = useSize();
const emit = defineEmits(["closeDropdown"]);
</script>

<style lang="scss" scoped>
.Fontsize {
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: space-between;
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
