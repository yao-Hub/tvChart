<template>
  <el-dropdown trigger="hover">
    <div class="iconbox">
      <div class="triangle"></div>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>
          <div class="item" @click="() => layoutChange('symbolsVisable')">
            <el-icon><Select v-if="layoutStore.symbolsVisable" /></el-icon>
            <span>{{ $t("symbolListArea") }}</span>
          </div>
        </el-dropdown-item>

        <el-dropdown-item>
          <div class="item" @click="() => layoutChange('orderAreaVisable')">
            <el-icon><Select v-if="layoutStore.orderAreaVisable" /></el-icon>
            <span>{{ $t("orderArea") }}</span>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { refreshLayout } from "@/utils/dragResize/drag_position";
import { nextTick } from "vue";

import { useLayout } from "@/store/modules/layout";
const layoutStore = useLayout();

const layoutChange = async (type: "symbolsVisable" | "orderAreaVisable") => {
  layoutStore[type] = !layoutStore[type];
  await nextTick();
  refreshLayout();
  layoutStore.rememberLayout();
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.iconbox {
  background-image: url("@/assets/icons/light/icon_1.svg");
  &:hover {
    @include background_color("background-hover");
  }
  .triangle {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 4px 4px 0 0; /* 设置三角形的大小 */
  }
}
[data-theme="light"] .triangle {
  border-color: transparent #63636a;
}
[data-theme="dark"] .triangle {
  border-color: transparent #b0b1b3;
}
.item {
  min-width: 180px;
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
