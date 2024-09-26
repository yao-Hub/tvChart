<template>
  <a-menu-item>
    <div class="item" @click="changeColor('upRedDownGreen')">
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-a-v31-16px-line-Lighthongzhanglvdie"></use>
      </svg>
      <span>{{ $t("upRedDownGreen") }}</span>
      <CheckOutlined
        v-if="themeStore.upDownTheme === 'upRedDownGreen'"
        class="checkIcon"
      />
    </div>
  </a-menu-item>
  <a-menu-item>
    <div class="item" @click="changeColor('upGreenDownRed')">
      <svg class="icon" aria-hidden="true">
        <use xlink:href="#icon-a-20px-lvzhanghongdie"></use>
      </svg>
      <span>{{ $t("upGreenDownRed") }}</span>
      <CheckOutlined
        v-if="themeStore.upDownTheme === 'upGreenDownRed'"
        class="checkIcon"
      />
    </div>
  </a-menu-item>
</template>

<script setup lang="ts">
import { CheckOutlined } from "@ant-design/icons-vue";
import { useTheme } from "@/store/modules/theme";
const themeStore = useTheme();

const changeColor = (theme: "upRedDownGreen" | "upGreenDownRed") => {
  themeStore.setUpDownTheme(theme);
};
</script>

<style lang="scss" scoped>
.item {
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
