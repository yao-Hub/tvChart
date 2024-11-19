<template>
  <div class="header">
    <div class="left">
      <!-- 菜单 -->
      <Menu></Menu>
      <div class="menu_divider"></div>
      <!-- 订单 -->
      <el-button @click="orderStore.createOrder()" class="orderBtn">
        {{ $t("order.new") }}
      </el-button>
      <div class="tools">
        <div class="tools_1">
          <LayoutVisibled></LayoutVisibled>
          <FastTransation></FastTransation>
        </div>
        <div class="tool_divider"></div>
        <div class="tools_2">
          <SingleLayout></SingleLayout>
          <MultipleLayout></MultipleLayout>
          <HorizontalLayout></HorizontalLayout>
          <VerticalLayout></VerticalLayout>
          <CreateChart></CreateChart>
        </div>
      </div>
    </div>
    <Account></Account>
  </div>
</template>

<script setup lang="ts">
import LayoutVisibled from "./components/LayoutVisibled.vue";
import Menu from "./components/Menu/index.vue";
import Account from "./components/Account.vue";
import FastTransation from "./components/FastTransation.vue";
import SingleLayout from "./components/ChartLayout/Single.vue";
import MultipleLayout from "./components/ChartLayout/Multiple.vue";
import HorizontalLayout from "./components/DirectionalLayout/Horizonta.vue";
import VerticalLayout from "./components/DirectionalLayout/Vertical.vue";
import CreateChart from "./components/CreateChart.vue";

import { useOrder } from "@/store/modules/order";
const orderStore = useOrder();
</script>

<style>
.iconbox {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  padding: 2px;
  cursor: pointer;
  box-sizing: border-box;
  background-repeat: no-repeat;
  background-size: 24px 24px;
  background-position: center;
}
</style>
<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  box-sizing: border-box;
  @include background_color("background-component");

  .left {
    box-sizing: border-box;
    height: 100%;
    display: flex;
    align-items: center;

    .orderBtn {
      width: 72px;
      height: 32px;
      margin-left: 16px;
    }

    .menu_divider {
      height: 32px;
      width: 1px;
      @include background_color("border");
    }

    .tools {
      display: flex;
      align-items: center;
      margin-left: 16px;

      .tools_1 {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .tools_2 {
        display: flex;
        align-items: center;
      }

      .tool_divider {
        width: 1px;
        height: 18px;
        @include background_color("border");
        margin: 0 8px;
      }
    }
  }

  .header__right {
    display: flex;
    gap: 8px;
  }
}
</style>
