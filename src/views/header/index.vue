<template>
  <div class="header">
    <div class="header__left">
      <Menu></Menu>
      <a-tooltip :title="`${$t('shortcutkey')}: F9`">
        <a-button type="link" @click="orderStore.createOrder()">{{ $t('order.new') }}</a-button>
      </a-tooltip>
      <LayoutVisibled></LayoutVisibled>
      <ThunderboltOutlined />
      <a-tooltip :title="$t('SingleImageMode')">
        <BorderOutlined @click="chartInitStore.chartLayoutType = 'single'" />
      </a-tooltip>
      <a-tooltip :title="$t('MultiGrapMode')">
        <AppstoreFilled @click="chartInitStore.chartLayoutType = 'multiple'" />
      </a-tooltip>
    </div>
    <div class="header__right">
      <Account></Account>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ThunderboltOutlined,
  BorderOutlined,
  AppstoreFilled
} from '@ant-design/icons-vue';

import LayoutVisibled from './components/LayoutVisibled.vue';
import Menu from './components/Menu/index.vue';
import Account from './components/Account/index.vue';

import { useChartInit } from '@/store/modules/chartInit';
import { useOrder } from '@/store/modules/order';
const chartInitStore = useChartInit();
const orderStore = useOrder();
</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.header {
  padding: 0 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  border-bottom: 1px solid;
  @include border_color('border');
  box-sizing: border-box;

  .header__left {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-evenly;
  }

  .header__right {
    display: flex;
    gap: 8px;
  }
}
</style>
