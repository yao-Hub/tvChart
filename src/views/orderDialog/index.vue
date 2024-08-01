<template>
  <div>
    <a-modal
      :width="700"
      :open="open"
      :key="open"
      :title="title"
      @cancel="handleCancel"
      :bodyStyle="state.bodyStyle"
      :footer="null"
    >
      <div class="main">
        <a-menu
          class="left"
          v-model:selectedKeys="state.selectedKeys"
          mode="inline"
          :items="state.items"
        ></a-menu>
        <div class="right">
          <div class="title">新{{ title }}</div>
          <a-divider class="divider"></a-divider>

          <SymbolSelect
            class="symbolSelect"
            type="tradeAllow"
            v-model="state.symbol"
            @change="symbolChange"
          ></SymbolSelect>

          <div v-if="state.loading" class="loadingSpin">
            <Spin></Spin>
          </div>
          <keep-alive v-else>
            <component
              :is="state.componentMap[state.selectedKeys[0]]"
              :selectedSymbol="state.symbol"
              :currentSymbolInfo="currentSymbolInfo"
              :ask="state.quote.ask"
              :bid="state.quote.bid"
              :high="state.newKlineData.high"
              :low="state.newKlineData.low"
              @success="orderSucced"
            ></component>
          </keep-alive>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch, markRaw, watchEffect } from "vue";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useChartSub } from "@/store/modules/chartSub";

import { klineHistory } from "api/kline/index";

import Limit from "./components/orders/Limit.vue";
import Price from "./components/orders/Price.vue";
import Stop from "./components/orders/Stop.vue";
import StopLimit from "./components/orders/StopLimit.vue";

import { OrderType } from "#/order";

const dialogStore = useDialog();
const orderStore = useOrder();
const subStore = useChartSub();

const state = reactive({
  selectedKeys: ["price"] as OrderType[],
  bodyStyle: {
    backgroundColor: "#525252",
    borderRadius: "8px",
  },
  items: [
    { key: "price", label: "市价单" },
    { key: "limit", label: "限价单" },
    { key: "stop", label: "止损单" },
    { key: "stopLimit", label: "止损限价单" },
  ],
  componentMap: {
    price: markRaw(Price),
    limit: markRaw(Limit),
    stop: markRaw(Stop),
    stopLimit: markRaw(StopLimit),
  },
  symbol: "",
  // 报价
  quote: {
    ask: 0,
    bid: 0,
    ctm_ms: 0,
    ctm: 0,
    symbol: "",
    server: "upway-live",
  },
  // k线最新数据（最高最低价）
  newKlineData: {
    close: 0,
    ctm: 0,
    date_time: "",
    high: 0,
    low: 0,
    open: 0,
    volume: 0,
  },
  socketList: [] as string[],
  loading: false,
});

watchEffect(() => {
  orderStore.selectedMenuKey = state.selectedKeys[0];
});

// 弹窗打开隐藏
const open = computed(() => {
  return dialogStore.orderDialogVisible;
});

// 弹框关闭
const handleCancel = () => {
  dialogStore.closeOrderDialog();
};

// 当前品种
const currentSymbolInfo = computed(() => {
  return subStore.symbols.find((e) => e.symbol === state.symbol);
});

// 弹框标题
const title = computed(() => {
  const item = state.items.find((e) => e.key === state.selectedKeys[0]);
  return item?.label;
});

// 给当前页面的报价赋值
watch(
  () => orderStore.currentQuotes,
  (newVal) => {
    if (newVal && newVal[state.symbol]) {
      state.quote = newVal[state.symbol];
    }
  },
  { immediate: true, deep: true }
);

// 给最高最低价赋值
watch(
  () => orderStore.currentKline,
  (newVal) => {
    if (newVal && newVal.symbol === state.symbol) {
      state.newKlineData = newVal;
    }
  },
  { immediate: true }
);

// 弹窗初始化
watch(open, (newVal) => {
  if (newVal) {
    state.symbol = orderStore.currentSymbol;
    getklineHistory();
  }
});

// 初始化最高最低价
const getklineHistory = async () => {
  const { data } = await klineHistory({
    period_type: "1",
    symbol: state.symbol,
    count: 1,
    limit_ctm: Math.floor(Date.now() / 1000),
  });
  state.newKlineData = data[0];
};

// 品种变化
const symbolChange = async (value: string) => {
  state.loading = true;
  if (state.socketList.indexOf(value) === -1) {
    state.socketList.push(value);
  }
  await getklineHistory();
  state.loading = false;
};

const orderSucced = () => {
  orderStore.refreshOrderArea = true;
  handleCancel();
};
</script>

<style scoped lang="scss">
@import "@/assets/styles/_handle.scss";
.divider {
  margin: 5px 0 10px 0;
}
.main {
  display: flex;
  width: 100%;
  padding: 3px;
  .left {
    width: 129px;
  }
  .right {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    .title {
      font-size: 21px;
    }
    .symbolSelect {
      width: 100%;
      margin: 8px 0;
    }
    .loadingSpin {
      flex: 1;
      position: relative;
      min-height: 300px;
    }
  }
}
:deep(.ant-menu) {
  border-radius: 8px 0 0 8px;
}
:deep(.ant-menu-inline .ant-menu-item) {
  width: calc(100% - 3px);
  border-radius: 8px 0 0 8px;
  color: #fff;
}
:deep(.ant-menu-item-selected) {
  background-color: #525252;
}
.ant-radio-button-wrapper {
  height: auto;
  flex: 1;
  text-align: center;
}
.ant-radio-button-wrapper-checked:not(
    .ant-radio-button-wrapper-disabled
  ):first-child {
  border-color: #dd6600;
}
.ant-radio-button-wrapper-checked:not(
    .ant-radio-button-wrapper-disabled
  ):last-child {
  border-color: #19b52d;
}
.ant-radio-button-wrapper-checked:not(
    .ant-radio-button-wrapper-disabled
  )::before,
.ant-radio-button-wrapper-checked:not(
    .ant-radio-button-wrapper-disabled
  )::before {
  background-color: #19b52d;
}
</style>
