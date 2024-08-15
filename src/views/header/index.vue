<template>
  <div class="header">
    <div class="header__left">
      <!-- 菜单 -->
      <Menu></Menu>
      <a-divider type="vertical" class="divider" />
      <!-- 订单 -->
      <a-tooltip :title="`${$t('shortcutkey')}: F9`">
        <a-button
          @click="orderStore.createOrder()"
          class="header__left_orderBtn"
          >{{ $t("order.new") }}</a-button
        >
      </a-tooltip>
      <!-- 布局显隐 -->
      <LayoutVisibled></LayoutVisibled>
      <!-- 快速交易 -->
      <FastTransation></FastTransation>
      <!-- 单图 -->
      <a-tooltip :title="$t('SingleImageMode')">
        <BorderOutlined @click="() => chartInitStore.setLayoutType('single')" style="margin-left: 16px;"/>
      </a-tooltip>
      <a-divider type="vertical" class="divider-small" />
      <!-- 多图 -->
      <a-tooltip :title="$t('MultiGrapMode')">
        <AppstoreFilled @click="() => chartInitStore.setLayoutType('multiple')" />
      </a-tooltip>
      <a-divider type="vertical" class="divider-small" />
      <!-- 纵向布局 -->
      <a-tooltip title="纵向布局">
        <i class="iconfont" style="font-size: 12px" @click="verticalLayout" >&#xe601;</i>
      </a-tooltip>
      <a-divider type="vertical" class="divider-small" />
      <!-- 横向布局 -->
      <a-tooltip title="横向布局">
        <i class="iconfont" style="font-size: 12px" @click="horizontalLayout">&#xe600;</i>
      </a-tooltip>
    </div>
    <div class="header__right">
      <Account></Account>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BorderOutlined, AppstoreFilled } from "@ant-design/icons-vue";

import LayoutVisibled from "./components/LayoutVisibled.vue";
import Menu from "./components/Menu/index.vue";
import Account from "./components/Account/index.vue";
import FastTransation from "./components/FastTransation/index.vue";

import { horizontalLayout, verticalLayout } from "utils/dragResize/index";

import { useChartInit } from "@/store/modules/chartInit";
import { useOrder } from "@/store/modules/order";
const chartInitStore = useChartInit();
const orderStore = useOrder();
chartInitStore.intLayoutType();
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  box-sizing: border-box;
  @include background_color("background-component");

  .header__left {
    box-sizing: border-box;
    height: 100%;
    display: flex;
    align-items: center;
    .divider {
      height: 32px;
      @include background_color("border");
    }
    .divider-small {
      height: 12px;
      @include background_color("border");
      margin: 0 7px;
    }
    &_orderBtn {
      width: 72px;
      height: 32px;
      margin: 0 16px;
    }
  }

  .header__right {
    display: flex;
    gap: 8px;
  }
}
</style>
