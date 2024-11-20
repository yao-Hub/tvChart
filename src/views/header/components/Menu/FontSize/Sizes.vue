<template>
  <el-dropdown-menu>
    <el-dropdown-item v-for="size in sizeList">
      <div class="item" @click="sizeStore.changeSize(size)">
        <span class="label">{{ $t(`font.${size}`) }}</span>
        <img
          class="logo"
          src="@/assets/icons/select.svg"
          v-if="sizeStore.nowSize === size"
        />
      </div>
    </el-dropdown-item>
  </el-dropdown-menu>
</template>

<script setup lang="ts">
import { useSize } from "@/store/modules/size";
const sizeStore = useSize();

const sizeList = ["small", "medium", "large"];
</script>

<style lang="scss" scoped>
.item {
  width: 150px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
}
</style>
