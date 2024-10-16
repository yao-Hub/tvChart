<template>
  <el-dropdown trigger="hover" placement="right-start">
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
    <template #dropdown>
      <Colors></Colors>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { RightOutlined, BgColorsOutlined } from "@ant-design/icons-vue";
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