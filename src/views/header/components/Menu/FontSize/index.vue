<template>
  <el-dropdown trigger="hover" placement="right-start">
    <div class="expandIcon">
      <div class="expandIcon_left">
        <FontSizeOutlined />
        <span>{{ $t("font.fontSize") }}</span>
      </div>
      <div class="expandIcon_right">
        <span>{{ $t(`font.${sizeStore.nowSize}`) }}</span>
        <RightOutlined style="font-size: 12px" />
      </div>
    </div>
    <template #dropdown>
      <Sizes></Sizes>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { RightOutlined, FontSizeOutlined } from "@ant-design/icons-vue";
import Sizes from "./Sizes.vue";
import { useSize } from "@/store/modules/size";
const sizeStore = useSize();
</script>

<style lang="scss" scoped>
.expandIcon {
  width: 200px;
  display: flex;
  justify-content: space-between;
  height: 32px;
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
