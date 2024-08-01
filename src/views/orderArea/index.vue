<template>
  <div class="orderArea">
    <a-tabs v-model:activeKey="activeKey" type="card">
      <a-tab-pane v-for="item in state.menu" :key="item.key">
        <template #tab>
          <span>
            {{ item.label }}
          </span>
          <a-tag
            :color="state.dataSource[item.key].length ? '#009345' : '#7f7f7f'"
            style="margin-left: 3px; scale: 0.8"
            >{{ state.dataSource[item.key].length }}</a-tag
          >
        </template>
      </a-tab-pane>
    </a-tabs>
    <div class="container">
      <div class="filter" v-show="activeKey === 'orderHistory'">
        <div style="display: flex; align-items: center">
          <span>品种：</span>
          <SymbolSelect
            v-model="state.pendingOrderSymbol"
            @change="debouncedGetOrderHistory"
            :selectOption="{ allowClear: true }"
            style="width: 200px"
          >
          </SymbolSelect>
        </div>
        <TimeSelect
          v-model="state.orderHistoryCreateTime"
          @timeRange="debouncedGetOrderHistory"
          >创建时间：</TimeSelect
        >
      </div>
      <div class="filter" v-show="activeKey === 'transactionHistory'">
        <div style="display: flex; align-items: center">
          <span>品种：</span>
          <SymbolSelect
            v-model="state.orderSymbol"
            @change="debouncedGetTradingHistory"
            :selectOption="{ allowClear: true }"
            style="width: 200px"
          >
          </SymbolSelect>
        </div>
        <TimeSelect
          v-model="state.transactionHistoryCreateTime"
          @timeRange="debouncedGetTradingHistory"
          >建仓时间：
        </TimeSelect>
        <TimeSelect
          v-model="state.transactionHistoryCloseTime"
          initFill
          @timeRange="debouncedGetTradingHistory"
          >平仓时间：
        </TimeSelect>
      </div>
      <a-table
        :dataSource="state.dataSource[activeKey]"
        :columns="state.columns[activeKey]"
        :pagination="false"
        :loading="state.loadingList[activeKey]"
        :scroll="{ x: 1300 }"
      >
        <template #bodyCell="{ record, column, index, text }">
          <div @dblclick="handleRowDoubleClick(record)">
            <template v-if="column.dataIndex === 'time_setup'">{{
              formatTime(record.time_setup)
            }}</template>
            <template v-else-if="column.dataIndex === 'time_expiration'">{{
              formatTime(record.time_expiration)
            }}</template>
            <template v-else-if="column.dataIndex === 'time_done'">{{
              formatTime(record.time_done)
            }}</template>
            <template v-else-if="column.dataIndex === 'volume'"
              >{{ record.volume / 100 }}手</template
            >
            <template v-else-if="column.dataIndex === 'type'">{{
              $t(`order.${getTradingDirection(record.type)}`)
            }}</template>
            <template v-else-if="column.dataIndex === 'orderType'">{{
              $t(`order.type.${getOrderType(record.type)}`)
            }}</template>
            <template v-else-if="column.dataIndex === 'now_price'">{{
              getNowPrice(record, index)
            }}</template>
            <template
              v-else-if="
                column.dataIndex === 'profit' && activeKey === 'position'
              "
              >{{ getProfit(record, index) }}</template
            >
            <template v-else-if="column.dataIndex === 'distance'">{{
              getDistance(record)
            }}</template>
            <template v-else-if="column.dataIndex === 'close_type'">{{
              getCloseType(record)
            }}</template>
            <template v-else-if="column.dataIndex === 'positionAction'">
              <a-tooltip title="平仓">
                <a-button
                  :icon="h(CloseOutlined)"
                  size="small"
                  @click="orderClose(record)"
                ></a-button>
              </a-tooltip>
            </template>
            <template v-else-if="column.dataIndex === 'orderAction'">
              <a-tooltip title="撤销">
                <a-button
                  :icon="h(CloseOutlined)"
                  size="small"
                  @click="delOrders(record)"
                ></a-button>
              </a-tooltip>
            </template>
            <template v-else>
              {{ text }}
            </template>
          </div>
        </template>
      </a-table>
    </div>
    <EditOrderDialog
      v-model:visible="state.closeDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="orderStore.currentQuotes[state.orderInfo.symbol]"
    >
    </EditOrderDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, h, ref, onMounted } from "vue";
import { cloneDeep, debounce } from "lodash";
import { CloseOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";

import moment from "moment";

import * as orders from "api/order/index";

import * as orderTypes from "#/order";
import { tableColumns } from "./config";
import { round } from "utils/common/index";
import { getTradingDirection, getOrderType } from "utils/order/index";
import { CLOSE_TYPE } from "@/constants/common";
import { orderChanges } from "utils/socket/operation";

import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useQuiTrans } from "@/store/modules/quickTransaction";

import EditOrderDialog from "../orderDialog/edit.vue";
import TimeSelect from "./components/TimeSelect.vue";

const userStore = useUser();
const orderStore = useOrder();
const quiTransStore = useQuiTrans();

interface Menu {
  label: string;
  key: orderTypes.TableDataKey;
}

const state = reactive({
  menu: [
    { label: "持仓", key: "position" },
    { label: "挂单", key: "order" },
    { label: "失效挂单", key: "orderHistory" },
    { label: "交易历史", key: "transactionHistory" },
  ] as Menu[],
  columns: tableColumns,
  dataSource: {
    position: [],
    order: [],
    orderHistory: [],
    transactionHistory: [],
  } as any,
  closeDialogVisible: false,
  orderInfo: {} as orders.resOrders,
  orderHistoryCreateTime: [],
  transactionHistoryCreateTime: [],
  transactionHistoryCloseTime: [],
  pendingOrderSymbol: "",
  orderSymbol: "",
  loadingList: {
    position: false,
    order: false,
    orderHistory: false,
    transactionHistory: false,
  },
});

const activeKey = ref<orderTypes.TableDataKey>("position");

// 挂单价距离
const getDistance = (e: orders.resOrders) => {
  const currentQuote = orderStore.currentQuotes[e.symbol];
  const type = getTradingDirection(e.type);
  const result = type === "buy" ? currentQuote.ask : currentQuote.bid;
  const entryPrice = +e.order_price;
  return round(Math.abs(result - entryPrice), 2);
};

// 平仓类型
const getCloseType = (e: orders.resHistoryOrders) => {
  const { close_type } = e;
  if (close_type !== undefined) {
    return CLOSE_TYPE[close_type];
  }
};

// 格式化表格时间字段
const formatTime = (timestamp: string) => {
  const result = moment(timestamp).format("YYYY-MM-DD HH:mm:ss");
  return result;
};

// 获取现价
const getNowPrice = (e: orders.resOrders, index: number) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const type = getTradingDirection(e.type);
    const result = type === "buy" ? currentQuote.bid : currentQuote.ask;
    orderStore.tableData[activeKey.value]![index].now_price = +result;
    return result;
  } catch (error) {
    return "";
  }
};

// 获取盈亏
const getProfit = (e: orders.resOrders, index: number) => {
  try {
    let result: string | number = "";
    const type = getTradingDirection(e.type);
    const currentQuote = orderStore.currentQuotes[e.symbol];
    // 持仓多单时，close_price = 现价卖价
    // 持仓空单时，close_price = 现价买价
    const closePrice = type === "buy" ? currentQuote.bid : currentQuote.ask;
    const { contract_size, storage, fee, open_price, volume } = e;
    // 建仓合约价值 = open_price X contract_size X volume / 100
    const buildingPrice = (open_price * contract_size * volume) / 100;
    // 平仓合约价值 = close_price X contract_size X volume / 100
    const closingPrice = (closePrice * contract_size * volume) / 100;
    // buy时 : profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
    // sell时 : profit = 建仓合约价值 - 平仓合约价值 + 手续费 + 过夜费
    const direction =
      type === "buy"
        ? closingPrice - buildingPrice
        : buildingPrice - closingPrice;
    result = (direction + (storage || 0) + (fee || 0)).toFixed(2);
    orderStore.tableData[activeKey.value]![index].profit = +result;
    return result;
  } catch (error) {
    return "";
  }
};

onMounted(() => {
  getOrders();
  getPendingOrders();
  debouncedGetTradingHistory();
  debouncedGetOrderHistory();
  orderChanges((type: string) => {
    switch (type) {
      case "order_opened":
        getOrders();
        userStore.getLoginInfo();
        break;
      case "order_closed":
        getOrders();
        getTradingHistory();
        userStore.getLoginInfo();
        break;
      case "order_modified":
        getOrders();
        break;
      case "pending_order_opened":
      case "pending_order_modified":
        getPendingOrders();
        break;
      case "pending_order_deleted":
        getPendingOrders();
        getOrderHistory();
        break;
      case "pending_order_dealt":
        getOrders();
        getPendingOrders();
        userStore.getLoginInfo();
        break;
      case "balance_order_added":
        userStore.getLoginInfo();
        break;
      default:
        break;
    }
  });
});

// 下单时触发
watchEffect(async () => {
  if (orderStore.refreshOrderArea) {
    getOrders();
    getPendingOrders();
    debouncedGetTradingHistory();
    debouncedGetOrderHistory();
    userStore.getLoginInfo();
    orderStore.refreshOrderArea = false;
  }
});

// 查询持仓
const getOrders = async () => {
  try {
    state.loadingList.position = true;
    const resOrders = await orders.openningOrders();

    state.dataSource.position = resOrders.data;
    orderStore.tableData.position = cloneDeep(resOrders.data);
  } finally {
    state.loadingList.position = false;
  }
};

// 市价单平仓
const orderClose = async (record: orders.resOrders) => {
  async function foo() {
    const res = await orders.marketOrdersClose({
      symbol: record.symbol,
      id: record.id,
      volume: record.volume,
    });
    if (res.data.action_success) {
      message.success("平仓成功");
      getOrders();
      getTradingHistory();
      userStore.getLoginInfo();
    }
  }

  if (!quiTransStore.ifQuick) {
    Modal.confirm({
      title: "确定平仓",
      onOk() {
        foo();
      },
    });
    return;
  }
  foo();
};

// 查询挂单（有效）
const getPendingOrders = async () => {
  try {
    state.loadingList.order = true;
    const res = await orders.pendingOrders();
    state.dataSource.order = res.data;
    orderStore.tableData.order = cloneDeep(res.data);
  } finally {
    state.loadingList.order = false;
  }
};

// 查询挂单历史（失效）
const getOrderHistory = async () => {
  try {
    if (!userStore.ifLogin) {
      return;
    }
    state.loadingList.orderHistory = true;
    const { orderHistoryCreateTime, pendingOrderSymbol } = state;
    const [begin_time, end_time] = orderHistoryCreateTime;
    const updata: any = {};
    updata.symbol = pendingOrderSymbol;
    updata.begin_time = begin_time;
    updata.end_time = end_time;
    const res = await orders.invalidPendingOrders(updata);
    state.dataSource.orderHistory = res.data;
  } finally {
    state.loadingList.orderHistory = false;
  }
};
const debouncedGetOrderHistory = debounce(() => getOrderHistory(), 500);

// 删除挂单
const delOrders = async (record: orders.resOrders) => {
  async function foo() {
    const res = await orders.delPendingOrders({
      id: record.id,
      symbol: record.symbol,
    });
    if (res.data.action_success) {
      message.success("撤销挂单成功");
      getPendingOrders();
      getOrderHistory();
      return;
    }
    message.error(res.data.err_text);
  }
  if (!quiTransStore.ifQuick) {
    Modal.confirm({
      title: "确定撤销",
      onOk() {
        foo();
      },
    });
    return;
  }
  foo();
};

// 查询交易历史
const getTradingHistory = async () => {
  try {
    if (!userStore.ifLogin) {
      return;
    }
    state.loadingList.transactionHistory = true;
    const {
      transactionHistoryCreateTime,
      transactionHistoryCloseTime,
      orderSymbol,
    } = state;
    const [open_begin_time, open_end_time] = transactionHistoryCreateTime;
    const [close_begin_time, close_end_time] = transactionHistoryCloseTime;
    const updata: any = {};
    updata.symbol = orderSymbol;
    updata.open_begin_time = open_begin_time;
    updata.open_end_time = open_end_time;
    updata.close_begin_time = close_begin_time;
    updata.close_end_time = close_end_time;
    const res = await orders.historyOrders(updata);
    state.dataSource.transactionHistory = res.data;
  } finally {
    state.loadingList.transactionHistory = false;
  }
};

const debouncedGetTradingHistory = debounce(() => getTradingHistory(), 500);

// 双击行
const handleRowDoubleClick = (record: orders.resOrders) => {
  if (activeKey.value === "position") {
    state.orderInfo = record;
    state.closeDialogVisible = true;
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.orderArea {
  padding: 5px 20px;
  display: flex;
  flex-direction: column;
  overflow: auto;
  box-sizing: border-box;
  position: relative;
  border-radius: 5px;

  // &::-webkit-scrollbar {
  //   width: 5px; /*  设置纵轴（y轴）轴滚动条 */
  //   height: 100%; /*  设置横轴（x轴）轴滚动条 */
  // }
  // // 滑块颜色
  // &::-webkit-scrollbar-thumb {
  //   border-radius: 10px;
  //   box-shadow: inset 0 0 5px #525252;
  //   background: #525252;
  // }
  // // 滚动条背景色
  // &::-webkit-scrollbar-track {
  //   border-radius: 0;
  //   box-shadow: inset 0 0 5px #131722;
  //   background: #131722;
  // }
  .container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .filter {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
  }
}

:deep(.ant-tabs-tab .ant-tabs-tab-active) {
  color: #d1d4dc;
}

:deep(.ant-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #d1d4dc;
}
</style>
