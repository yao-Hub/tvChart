<template>
  <div class="header">
    <div class="left">
      <!-- 菜单 -->
      <Menu></Menu>
      <div class="menu_divider"></div>
      <!-- 订单 -->
      <el-button @click="useOrder().createOrder()" class="orderBtn">
        {{ t("order.new") }}
      </el-button>
      <div class="tools">
        <div class="tool_item iconbox" v-if="ifElectron" @click="systemReload">
          <el-tooltip :content="t('refresh page')">
            <BaseImg iconName="refresh" />
          </el-tooltip>
        </div>
        <div class="tool_item tools_1">
          <LayoutVisibled></LayoutVisibled>
          <FastTransation></FastTransation>
        </div>
        <div class="tool_divider"></div>
        <div class="tool_item">
          <ChartLayouts></ChartLayouts>
          <CreateChart></CreateChart>
        </div>
      </div>
    </div>

    <div class="right">
      <Account></Account>
    </div>
  </div>
</template>

<script setup lang="ts">
import Account from "./components/Account.vue";
import ChartLayouts from "./components/ChartLayouts.vue";
import CreateChart from "./components/CreateChart.vue";
import FastTransation from "./components/FastTransation.vue";
import LayoutVisibled from "./components/LayoutVisibled.vue";
import Menu from "./components/Menu/index.vue";

import { useOrder } from "@/store/modules/order";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const systemReload = () => window.location.reload();

const ifElectron = process.env.IF_ELECTRON;
</script>

<style lang="scss">
@import "@/styles/_handle.scss";
.iconbox {
  width: 32px;
  height: 32px;
  border-radius: 2px;
  padding: 2px;
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    @include background_color("background-hover");
  }
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
  @include background_color("background");

  .left {
    box-sizing: border-box;
    height: 100%;
    display: flex;
    align-items: center;

    .orderBtn {
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

      .tool_item {
        display: flex;
        align-items: center;
      }
      .tools_1 {
        gap: 4px;
      }

      .tool_divider {
        width: 1px;
        height: 18px;
        @include background_color("border");
        margin: 0 8px;
      }
    }
  }

  .right {
    display: flex;
    gap: 8px;
    align-items: center;
  }
}
</style>
