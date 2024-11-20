<template>
  <el-dropdown trigger="click" @visible-change="visible = $event">
    <div class="menu">
      <div class="menuIcon" :class="{ menuIcon_active: visible }"></div>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>
          <OneTransactions></OneTransactions>
        </el-dropdown-item>
        <el-dropdown-item divided>
          <Theme></Theme>
        </el-dropdown-item>
        <el-dropdown-item>
          <Language></Language>
        </el-dropdown-item>
        <el-dropdown-item>
          <upDowncolor></upDowncolor>
        </el-dropdown-item>
        <el-dropdown-item>
          <FontSize></FontSize>
        </el-dropdown-item>
        <el-dropdown-item divided>
          <sendFeedback></sendFeedback>
        </el-dropdown-item>
        <el-dropdown-item>
          <aboutUs></aboutUs>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from "vue";
import OneTransactions from "./oneTransactions.vue";
// import TableSetting from './tableSetting.vue';
import Theme from "./theme.vue";
import Language from "./Language/index.vue";
import aboutUs from "./aboutUs.vue";
import sendFeedback from "./sendFeedback.vue";
import UpDowncolor from "./UpDowncolor/index.vue";
import FontSize from "./FontSize/index.vue";

const visible = ref(false);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.menu {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 8px;
  .menuIcon {
    background-image: url("@/assets/icons/menu.svg");
    background-repeat: no-repeat;
    background-size: var(--icon-size);
    background-position: center;
    width: 32px;
    height: 32px;
    cursor: pointer;
    &:hover {
      @include background_color("background-hover");
    }
    &_active {
      background-image: url("@/assets/icons/menuactive.svg");
    }
  }
}
</style>
