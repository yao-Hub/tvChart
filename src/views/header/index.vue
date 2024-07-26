<template>
  <div class="header">
    <div class="header__left">
      <MenuOutlined />
      <a-tooltip title="快捷键：F9">
        <a-button type="link" @click="orderStore.createOrder()">新订单</a-button>
      </a-tooltip>
      <LayoutVisibled></LayoutVisibled>
      <ThunderboltOutlined />
      <a-tooltip title="单图模式">
        <BorderOutlined @click="chartInitStore.chartLayoutType = 'single'" />
      </a-tooltip>
      <a-tooltip title="多图模式">
        <AppstoreFilled @click="chartInitStore.chartLayoutType = 'multiple'" />
      </a-tooltip>
    </div>
    <div class="header__right">
      <span>账号</span>
      <!-- <span>9999,9999</span> -->
      <CaretDownOutlined />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  MenuOutlined,
  ThunderboltOutlined,
  CaretDownOutlined,
  BorderOutlined,
  AppstoreFilled
} from '@ant-design/icons-vue';

import LayoutVisibled from './components/LayoutVisibled.vue';

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
