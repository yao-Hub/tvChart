<template>
  <el-dropdown trigger="click">
    <div class="menu">
      <MenuOutlined @click.prevent />
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
          <aboutUs></aboutUs>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { MenuOutlined } from "@ant-design/icons-vue";
import OneTransactions from "./oneTransactions.vue";
// import TableSetting from './tableSetting.vue';
import Theme from "./theme.vue";
import Language from "./Language/index.vue";
import aboutUs from "./aboutUs.vue";
import UpDowncolor from "./UpDowncolor/index.vue";
import FontSize from "./FontSize/index.vue";
</script>

<style lang="scss" scoped>
.menu {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
