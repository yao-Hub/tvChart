<template>
  <a-dropdown :trigger="['click']" v-model:open="state.visible">
    <MenuOutlined />
    <template #overlay>
      <a-menu>
        <a-menu-item>
          <quickTransactions @switchClick="state.visible = false"></quickTransactions>
        </a-menu-item>
        <a-menu-divider />
        <a-sub-menu :icon="h(SlidersOutlined)" title="图表设置" key="sub1">
          <TableSetting></TableSetting>
        </a-sub-menu>
        <a-menu-item>
          <Theme></Theme>
        </a-menu-item>
        <a-sub-menu key="sub2" :expandIcon="() => h(NowLocale)">
          <Language></Language>
        </a-sub-menu>
        <a-sub-menu key="sub3" :expandIcon="() => h(nowColor)">
          <RiseFallColor></RiseFallColor>
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
  SlidersOutlined,
} from '@ant-design/icons-vue';
import { reactive, h } from 'vue';
import quickTransactions from "./quickTransactions.vue";
import TableSetting from './tableSetting.vue';
import Theme from './theme.vue';
import Language from './Language/index.vue';
import NowLocale from './Language/NowLocale.vue';
import RiseFallColor from './RiseFallColor/index.vue';
import nowColor from './RiseFallColor/nowColor.vue';
import feedback from "./feedback.vue";
import aboutUs from "./aboutUs.vue";

const state = reactive({
  visible: false
});
</script>

<style lang="scss" scoped></style>
