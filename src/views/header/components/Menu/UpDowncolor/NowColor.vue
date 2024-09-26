<template>
  <div class="nowColor">
    <div class="nowColor_left">
      <BgColorsOutlined />
      <span>{{ $t("updownColor") }}</span>
    </div>
    <div class="nowColor_right">
      <svg class="icon" aria-hidden="true">
        <use
          xlink:href="#icon-a-v31-16px-line-Lighthongzhanglvdie"
          v-if="themeStore.upDownTheme === 'upRedDownGreen'"
        ></use>
        <use xlink:href="#icon-a-20px-lvzhanghongdie" v-else></use>
      </svg>
      <RightOutlined style="font-size: 12px" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RightOutlined, BgColorsOutlined } from "@ant-design/icons-vue";
import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();
</script>

<style lang="scss" scoped>
.nowColor {
  display: flex;
  justify-content: space-between;
  margin-inline-end: -17px;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
    align-items: center;
  }
}
</style>
