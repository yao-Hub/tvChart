<template>
  <a-dropdown :trigger="['click']">
    <MenuOutlined @click.prevent />
    <template #overlay>
      <a-menu>
        <a-menu-item>
          <OneTransactions></OneTransactions>
        </a-menu-item>
        <a-menu-divider />
        <!-- <a-sub-menu :icon="h(SlidersOutlined)" title="图表设置" key="sub1">
          <TableSetting></TableSetting>
        </a-sub-menu> -->
        <a-menu-item>
          <Theme></Theme>
        </a-menu-item>
        <a-sub-menu key="sub2" :expandIcon="() => h(NowLocale)">
          <Language></Language>
        </a-sub-menu>
        <a-menu-divider />
        <a-menu-item>
          <feedback></feedback>
        </a-menu-item>
        <a-menu-item>
          <aboutUs></aboutUs>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import {
  MenuOutlined,
  // SlidersOutlined,
} from "@ant-design/icons-vue";
import { h } from "vue";
import OneTransactions from "./oneTransactions.vue";
// import TableSetting from './tableSetting.vue';
import Theme from "./theme.vue";
import Language from "./Language/index.vue";
import NowLocale from "./Language/NowLocale.vue";
import feedback from "./feedback.vue";
import aboutUs from "./aboutUs.vue";
</script>

<style lang="scss" scoped></style>
