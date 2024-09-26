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
      <a-flex :gap="16" align="center">
        <!-- 布局显隐 -->
        <LayoutVisibled></LayoutVisibled>
        <!-- 快速交易 -->
        <FastTransation></FastTransation>
        <!-- 单图 -->
        <a-tooltip :title="$t('SingleImageMode')">
          <div
            :class="[layoutType === 'single' ? 'single single_active' : 'single single_noactive']"
            @click="() => chartInitStore.setLayoutType('single')"
          ></div>
        </a-tooltip>
        <!-- 多图 -->
        <a-tooltip :title="$t('MultiGrapMode')">
          <AppstoreFilled
            :class="[layoutType === 'multiple' ? 'active' : '']"
            @click="() => chartInitStore.setLayoutType('multiple')"
          />
        </a-tooltip>
        <!-- 纵向布局 -->
        <a-tooltip title="纵向布局">
          <i
            :class="[
              flexDirection === 'column' ? 'iconfont active' : 'iconfont',
            ]"
            style="font-size: 12px"
            @click="chartInitStore.setChartFlexDirection('column')"
            >&#xe601;</i
          >
        </a-tooltip>
        <!-- 横向布局 -->
        <a-tooltip title="横向布局">
          <i
            :class="[flexDirection === 'row' ? 'iconfont active' : 'iconfont']"
            style="font-size: 12px"
            @click="chartInitStore.setChartFlexDirection('row')"
            >&#xe600;</i
          >
        </a-tooltip>
      </a-flex>
    </div>
    <Account></Account>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { AppstoreFilled } from "@ant-design/icons-vue";

import LayoutVisibled from "./components/LayoutVisibled.vue";
import Menu from "./components/Menu/index.vue";
import Account from "./components/Account/index.vue";
import FastTransation from "./components/FastTransation/index.vue";

import { useChartInit } from "@/store/modules/chartInit";
import { useOrder } from "@/store/modules/order";
const chartInitStore = useChartInit();
const orderStore = useOrder();

const layoutType = computed(() => chartInitStore.chartLayoutType);
const flexDirection = computed(() => chartInitStore.chartFlexDirection);
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

.active {
  @include font_color("primary");
}
.single_active {
  @include background_color("primary");
}
.single_noactive {
  background: #333333;
}
.single {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
}
</style>
