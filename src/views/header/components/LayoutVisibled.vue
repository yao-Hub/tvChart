<template>
  <el-dropdown trigger="click">
    <div class="icons">
      <LayoutOutlined class="icons_left" />
      <DownOutlined class="icons_right" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>
          <div class="item" @click="() => layoutChange('symbolsVisable')">
            <el-icon><Select v-if="layoutStore.symbolsVisable" /></el-icon>
            <span>活跃交易品种面板</span>
          </div>
        </el-dropdown-item>

        <el-dropdown-item>
          <div class="item" @click="() => layoutChange('orderAreaVisable')">
            <el-icon><Select v-if="layoutStore.orderAreaVisable" /></el-icon>
            <span>交易看板</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { nextTick } from "vue";
import { LayoutOutlined, DownOutlined } from "@ant-design/icons-vue";
import { resizeUpdate } from "@/utils/dragResize/drag_position";

import { useLayout } from "@/store/modules/layout";
const layoutStore = useLayout();

const layoutChange = async (type: "symbolsVisable" | "orderAreaVisable") => {
  layoutStore[type] = !layoutStore[type];
  await nextTick();
  resizeUpdate();
  layoutStore.rememberLayout();
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.icons {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 36px;
  height: 24px;
  border-radius: 4px;
  &:hover {
    @include background_color("background-hover");
  }
  &_left {
    width: 12px;
    height: 12px;
    margin-right: 3px;
  }

  &_right {
    width: 12px;
    height: 12px;
    transform: scale(0.4, 0.4) !important;
  }
}
.item {
  width: 180px;
  height: 32px;
  display: flex;
  align-items: center;
  @include font_color("word");
  box-sizing: border-box;
}
:deep(.el-dropdown-menu__item) {
  margin: 0 8px;
  border-radius: 4px;
}
</style>
