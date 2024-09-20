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
    <div class="item" style="border: none; flex: 0; width: 108px;">
      <a-dropdown v-model:open="visible" placement="top" :trigger="[ 'click' ]">
        <div :class="[+currentDelay > 500 ? 'redWord delay' : 'greenWord delay']">
          <i class="iconfont">&#xe602;</i>
          <span>{{ currentDelay }}ms</span>
        </div>
        <template #overlay>
          <a-menu @click="handleMenuClick">
            <a-menu-item v-for="node in networkStore.nodeList" :key="node.nodeName">
              <a-flex justify="space-between" align="center" class="delayItem">
                <a-flex gap="5">
                  <CheckOutlined v-show="node.nodeName === networkStore.currentNode?.nodeName" class="checkIcon"/>
                  <span class="nodeName"> {{ node.nodeName }} </span>
                </a-flex>
                <span :class="[+getDelay(node.webWebsocket) > 500 ? 'redWord' : 'greenWord']">{{ getDelay(node.webWebsocket) }}ms</span>
              </a-flex>
            </a-menu-item>
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
import { round } from "utils/common/index";

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

import { get } from "lodash";
import { useSocket } from "@/store/modules/socket";
import { CheckOutlined } from '@ant-design/icons-vue';
const socketStore = useSocket();
const currentDelay = computed(() => {
  const currentWsUri = networkStore.currentNode?.webWebsocket || '';
  const delay = get(socketStore.delayMap, currentWsUri) || '-';
  return delay;
});
const getDelay = (uri: string) => {
  const delay = get(socketStore.delayMap, uri) || '-';
  return delay;
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

.delay {
  display: flex;
  cursor: pointer;
  font-size: 12px;
  gap: 5px;
  justify-content: center;
}
.delay:hover {
  @include font_color("primary");
}
.checkIcon {
  @include font_color("primary");
}
.delayItem {
  min-width: 300px;
  font-size: 14px;
  .nodeName {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.redWord {
  color: #FF4A61;
}
.greenWord {
  color: #00C673;
}
</style>
