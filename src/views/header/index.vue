<template>
  <div class="header">
    <div class="header__left">
      <!-- 菜单 -->
      <Menu></Menu>
      <el-divider direction="vertical" class="divider" />
      <!-- 订单 -->
      <el-button
        @click="orderStore.createOrder()"
        class="header__left_orderBtn"
        >{{ $t("order.new") }}</el-button
      >
      <div class="toolList">
        <LayoutVisibled></LayoutVisibled>
        <FastTransation></FastTransation>
        <el-tooltip :content="$t('SingleImageMode')">
          <div
            :class="[
              layoutType === 'single'
                ? 'single single_active'
                : 'single single_noactive',
            ]"
            @click="() => chartInitStore.setLayoutType('single')"
          ></div>
        </el-tooltip>
        <el-tooltip :content="$t('MultiGrapMode')">
          <AppstoreFilled
            :class="[layoutType === 'multiple' ? 'active' : '']"
            @click="() => chartInitStore.setLayoutType('multiple')"
          />
        </el-tooltip>
        <el-tooltip content="纵向布局">
          <i
            :class="[
              flexDirection === 'column' ? 'iconfont active' : 'iconfont',
            ]"
            style="font-size: 12px"
            @click="chartInitStore.setChartFlexDirection('column')"
            >&#xe601;</i
          >
        </el-tooltip>
        <el-tooltip content="横向布局">
          <i
            :class="[flexDirection === 'row' ? 'iconfont active' : 'iconfont']"
            style="font-size: 12px"
            @click="chartInitStore.setChartFlexDirection('row')"
            >&#xe600;</i
          >
        </el-tooltip>
      </div>
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
@import "@/styles/_handle.scss";

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

    .toolList {
      display: flex;
      gap: 8px;
      align-items: center;
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
  background: #d1d4dc;
}
.single {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  cursor: pointer;
}
</style>
