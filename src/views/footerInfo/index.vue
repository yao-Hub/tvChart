<template>
  <div class="footerInfo">
    <div class="item">
      <span>{{ $t("order.balance") }}: </span>
      <span>{{ loginInfo?.balance }}</span>
    </div>
    <div class="item">
      <span>{{ $t("order.equity") }}: </span>
      <span>{{ equity }}</span>
    </div>
    <div class="item">
      <span>{{ $t("order.Margin") }}: </span>
      <span>{{ Margin }}</span>
    </div>
    <div class="item">
      <span>{{ $t("order.marginFree") }}: </span>
      <span>{{ margin_free }}</span>
    </div>
    <div class="item">
      <span>{{ $t("order.marginLevel") }}: </span>
      <span>{{ margin_level }}</span>
    </div>
    <div class="item">
      <span>{{ $t("order.TotalProfit") }}: </span>
      <span>{{ profit }}</span>
    </div>
    <div class="item" style="border: none">
      <a-dropdown v-model:open="visible" placement="top" size="large">
        <span>
          {{ networkStore.currentNode?.nodeName }}
        </span>
        <template #overlay>
          <a-menu @click="handleMenuClick">
            <a-menu-item v-for="node in networkStore.nodeList" :key="node.nodeName">{{ node.nodeName }}</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
// import { useChartSub } from '@/store/modules/chartSub';
import { round } from "utils/common/index";

// const subStore = useChartSub();
const userStore = useUser();
const orderStore = useOrder();

const loginInfo = computed(() => userStore.loginInfo);

// 净值
const equity = computed(() => {
  try {
    if (!loginInfo.value) {
      return "-";
    }
    const currentPosition = orderStore.tableData.position;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.profit;
    }, 0);
    return round(+loginInfo.value.balance + (sum || 0), 2);
  } catch (error) {
    return "-";
  }
});

// 预付款
const Margin = computed(() => {
  try {
    if (!loginInfo.value) {
      return "-";
    }
    return loginInfo.value.margin;
    // const currentPosition = orderStore.tableData.position;
    // const sum = currentPosition?.reduce((accumulator, item) => {
    //   let result = 0;
    //   const symbol = subStore.symbols.find(e => e.symbol === item.symbol);
    //   if (symbol) {
    //     const leverage = symbol.leverage;
    //     const margin = symbol.margin;
    //     if (leverage) {
    //       result = +item.open_price * symbol.contract_size / leverage * item.volume / 100;
    //     } else {
    //       result = margin * item.volume / 100;
    //     }
    //     return accumulator + result;
    //   } else {
    //     return accumulator;
    //   }
    // }, 0);
    // return round(sum || 0, 2);
  } catch (error) {
    return "-";
  }
});

// 可用预付款
const margin_free = computed(() => {
  if (equity.value !== "-" && Margin.value !== "-") {
    return round(Number(equity.value) - Number(Margin.value), 2);
  }
  return "-";
});

// 预付款水平
const margin_level = computed(() => {
  if (+Margin.value === 0) {
    return 0;
  }
  if (equity.value !== "-" && Margin.value !== "-") {
    return round((+equity.value / +Margin.value) * 100, 2);
  }
  return "-";
});

// 总盈亏
const profit = computed(() => {
  try {
    if (!loginInfo.value) {
      return "-";
    }
    const currentPosition = orderStore.tableData.position;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + Number(currentValue.profit);
    }, 0);
    return round(sum || 0, 2);
  } catch (error) {
    return "-";
  }
});


import { ref } from 'vue';
import type { MenuProps } from 'ant-design-vue';
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();

const visible = ref(false);
const handleMenuClick: MenuProps['onClick'] = e => {
  const name = e.key as string;
  networkStore.changeNode(name);
  window.location.reload();
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.footerInfo {
  width: 100vw;
  box-sizing: border-box;
  height: 30px;
  @include background_color("background-component");
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  overflow: auto;
  display: flex;

  .item {
    flex: 1;
    min-width: 100px;
    border-right: 1px solid;
    @include border_color("border");
    height: 30px;
    line-height: 30px;
    padding: 0 20px;
    overflow: auto;
    text-align: center;
  }
}
</style>
