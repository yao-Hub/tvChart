<template>
  <div class="orderArea">
    <div class="orderArea_header">
      <baseTabs v-model:activeKey="activeKey">
        <TabItem
          v-for="item in state.menu"
          :key="item.key"
          :activeKey="item.key"
          :tab="item.label"
        >
        </TabItem>
      </baseTabs>
      <Feedback></Feedback>
    </div>
    <div class="container" ref="container">
      <div class="filter">
        <SymbolSelect
          style="min-width: 130px"
          v-model="state.updata[activeKey].symbol"
          :selectOption="{ allowClear: true, mode: 'multiple', maxTagCount: 1 }"
        >
        </SymbolSelect>
        <a-select
          style="width: 130px"
          v-show="activeKey === 'position'"
          v-model:value="state.updata[activeKey].direction"
          allowClear
          placeholder="方向"
        >
          <a-select-option value="buy">{{ $t("order.buy") }}</a-select-option>
          <a-select-option value="sell">{{ $t("order.sell") }}</a-select-option>
        </a-select>
        <a-select
          style="width: 130px"
          v-show="activeKey === 'position'"
          v-model:value="state.updata[activeKey].pol"
          allowClear
          placeholder="盈亏"
        >
          <a-select-option value="profit">盈利</a-select-option>
          <a-select-option value="loss">亏损</a-select-option>
        </a-select>
        <TimeSelect
          v-show="activeKey === 'orderHistory'"
          v-model="state.updata[activeKey].createTime"
          :pickerOption="{ placeholder: ['创建开始时间', '创建结束时间'] }"
          @timeRange="getTableDate(activeKey)"
          >创建时间：</TimeSelect
        >
        <TimeSelect
          v-show="activeKey === 'transactionHistory'"
          v-model="state.updata[activeKey].addTime"
          :pickerOption="{ placeholder: ['建仓开始时间', '建仓结束时间'] }"
          @timeRange="getTableDate(activeKey)"
          >建仓时间：</TimeSelect
        >
        <TimeSelect
          v-show="activeKey === 'transactionHistory'"
          initFill
          v-model="state.updata[activeKey].closeTime"
          :pickerOption="{ placeholder: ['平仓开始时间', '平仓结束时间'] }"
          @timeRange="getTableDate(activeKey)"
          >平仓时间：</TimeSelect
        >
        <CloseOrder
          class="closeBtn"
          v-show="['position'].includes(activeKey)"
          :orderType="activeKey"
          @closeClick="closeOrders"
        ></CloseOrder>
        <a-button
          class="closeBtn"
          type="primary"
          v-show="activeKey === 'order'"
          @click="closeOrders(orderStore.tableData['order'] || [], 'order')"
          >全部撤单</a-button
        >
      </div>
      <a-table
        :dataSource="state.dataSource[activeKey]"
        :columns="state.columns[activeKey]"
        :pagination="false"
        :loading="state.loadingList[activeKey]"
        :scroll="{ y: tableY }"
      >
        <template #bodyCell="{ record, column, text }">
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
              getNowPrice(record)
            }}</template>
            <template v-else-if="column.dataIndex === 'profit'">
              <span :class="[getCellClass(record.profit)]">
                {{
                  activeKey === "position" ? getProfit(record) : record.profit
                }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'storage'">
              <span :class="[getCellClass(record.storage)]">{{
                record.storage
              }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'fee'">
              <span :class="[getCellClass(record.fee)]">{{ record.fee }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'distance'">{{
              getDistance(record)
            }}</template>
            <template v-else-if="column.dataIndex === 'close_type'">{{
              getCloseType(record)
            }}</template>
            <template v-else-if="column.dataIndex === 'days'">{{
              getDays(record)
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
              {{ [null, undefined, ""].includes(text) ? "-" : text }}
            </template>
          </div>
        </template>
      </a-table>
    </div>
    <EditOrderDialog
      v-model:visible="state.closeDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="getQuote()"
    >
    </EditOrderDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect, h, ref, onMounted, watch } from "vue";
import { cloneDeep, debounce, throttle, set } from "lodash";
import { CloseOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";

import moment from "moment";

import * as orders from "api/order/index";

import * as orderTypes from "#/order";
import { tableColumns } from "./config";
import { round } from "utils/common/index";
import { getTradingDirection, getOrderType } from "utils/order/index";
import { CLOSE_TYPE } from "@/constants/common";

import { useUser } from "@/store/modules/user";
import { useOrder } from "@/store/modules/order";
import { useDialog } from "@/store/modules/dialog";
import { useSocket } from "@/store/modules/socket";

import EditOrderDialog from "../orderDialog/edit.vue";
import TimeSelect from "./components/TimeSelect.vue";
import CloseOrder from "./components/CloseOrder.vue";
import Feedback from "./components/Feedback/index.vue";

const userStore = useUser();
const orderStore = useOrder();
const dialogStore = useDialog();
const socketStore = useSocket();

interface Menu {
  label: string;
  key: orderTypes.TableDataKey;
}

const state = reactive({
  menu: [
    { label: "持仓", key: "position" },
    { label: "挂单", key: "order" },
    { label: "历史持仓", key: "transactionHistory" },
    { label: "历史挂单", key: "orderHistory" },
  ] as Menu[],
  columns: tableColumns,
  dataSource: {
    position: [],
    order: [],
    orderHistory: [],
    transactionHistory: [],
  } as Record<orderTypes.TableDataKey, orders.resOrders[]>,
  closeDialogVisible: false,
  orderInfo: {} as orders.resOrders,
  updata: {
    position: {
      symbol: [],
      direction: null,
      pol: null,
      createTime: "",
      addTime: "",
      closeTime: "",
    },
    order: {
      symbol: [],
      createTime: "",
      addTime: "",
      closeTime: "",
    },
    orderHistory: {
      symbol: [],
      createTime: "",
      addTime: "",
      closeTime: "",
    },
    transactionHistory: {
      symbol: [],
      createTime: "",
      addTime: "",
      closeTime: "",
    },
  } as Record<orderTypes.TableDataKey, any>,
  loadingList: {
    position: false,
    order: false,
    orderHistory: false,
    transactionHistory: false,
  },
});

const activeKey = ref<orderTypes.TableDataKey>("position");
const getCellClass = (num: number) => {
  if (!num) {
    return "";
  }
  return num > 0 ? "buyWord" : "sellWord";
};
// 筛选过滤
const filterData = () => {
  const active = activeKey.value;
  const originData = cloneDeep(orderStore.tableData[active]);
  const selectSymbols = state.updata[active].symbol;
  const direction = state.updata[active].direction;
  const pol = state.updata[active].pol;
  if (originData) {
    state.dataSource[active] = originData.filter((item) => {
      let symbolResult = true;
      let directionResult = true;
      let polResult = true;
      if (selectSymbols.length) {
        symbolResult = selectSymbols.includes(item.symbol);
      }
      if (direction) {
        directionResult = direction === getTradingDirection(item.type);
      }
      if (pol && pol === "profit") {
        polResult = item.profit > 0;
      }
      if (pol && pol === "loss") {
        polResult = item.profit < 0;
      }
      return symbolResult && directionResult && polResult;
    });
  }
};
watch(
  () => [
    state.updata[activeKey.value].symbol,
    state.updata[activeKey.value].direction,
    state.updata[activeKey.value].pol,
  ],
  throttle(() => filterData(), 100, { trailing: true })
);

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
const getNowPrice = (e: orders.resOrders) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const type = getTradingDirection(e.type);
    const result = type === "buy" ? currentQuote.bid : currentQuote.ask;
    const id = e.id;
    const data = orderStore.tableData[activeKey.value];
    if (data) {
      const index = data.findIndex((e) => e.id === id);
      if (index) {
        set(data, [index, "now_price"], +result);
      }
    }
    return result;
  } catch (error) {
    return "";
  }
};

// 获取盈亏
const getProfit = (e: orders.resOrders) => {
  try {
    let result: string | number = "";
    const type = getTradingDirection(e.type);
    const currentQuote = orderStore.currentQuotes[e.symbol];
    // 持仓多单时，close_price = 现价卖价
    // 持仓空单时，close_price = 现价买价
    const closePrice = type === "buy" ? currentQuote.bid : currentQuote.ask;
    const { contract_size, storage, fee, open_price, volume, id } = e;
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
    e.profit = +result;
    const data = orderStore.tableData[activeKey.value];
    if (data) {
      const index = data.findIndex((e) => e.id === id);
      if (index) {
        set(data, [index, "profit"], +result);
      }
    }
    return result;
  } catch (error) {
    return "";
  }
};
// 持仓天数
const getDays = (e: orders.resHistoryOrders) => {
  const timeDone = e.time_done || moment().valueOf();
  const openTime = e.open_time;
  const date1 = moment(openTime);
  const date2 = moment(timeDone);
  const daysDifference = date2.diff(date1, "days");
  return +daysDifference;
};

// 下单时触发
watchEffect(async () => {
  if (orderStore.refreshOrderArea) {
    await Promise.all([
      debouncedGetOrders(),
      debouncedGetPendingOrders(),
      debouncedGetTradingHistory(),
      debouncedGetOrderHistory(),
      userStore.getLoginInfo(),
    ]);
    orderStore.refreshOrderArea = false;
    filterData();
  }
});

// 查询持仓
const getOrders = async () => {
  try {
    state.loadingList.position = true;
    const res = await orders.openningOrders();
    state.dataSource.position = cloneDeep(res.data);
    orderStore.tableData.position = cloneDeep(res.data);
  } finally {
    state.loadingList.position = false;
  }
};

// 查询挂单（有效）
const getPendingOrders = async () => {
  try {
    state.loadingList.order = true;
    const res = await orders.pendingOrders();
    state.dataSource.order = cloneDeep(res.data);
    orderStore.tableData.order = cloneDeep(res.data);
  } finally {
    state.loadingList.order = false;
  }
};

// 查询挂单历史（失效）
const getOrderHistory = async () => {
  try {
    state.loadingList.orderHistory = true;
    const [begin_time, end_time] = state.updata.orderHistory.createTime;
    const updata: any = {};
    updata.begin_time = begin_time;
    updata.end_time = end_time;
    const res = await orders.invalidPendingOrders(updata);
    state.dataSource.orderHistory = res.data;
  } finally {
    state.loadingList.orderHistory = false;
  }
};

// 查询交易历史
const getTradingHistory = async () => {
  try {
    state.loadingList.transactionHistory = true;
    const { addTime, closeTime } = state.updata.transactionHistory;
    const [open_begin_time, open_end_time] = addTime;
    const [close_begin_time, close_end_time] = closeTime;
    const updata: any = {};
    updata.open_begin_time = open_begin_time;
    updata.open_end_time = open_end_time;
    updata.close_begin_time = close_begin_time;
    updata.close_end_time = close_end_time;
    const res = await orders.historyOrders(updata || {});
    state.dataSource.transactionHistory = res.data;
  } finally {
    state.loadingList.transactionHistory = false;
  }
};

const debouncedGetOrders = debounce(() => getOrders(), 200);
const debouncedGetPendingOrders = debounce(() => getPendingOrders(), 200);
const debouncedGetOrderHistory = debounce(() => getOrderHistory(), 200);
const debouncedGetTradingHistory = debounce(() => getTradingHistory(), 200);

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

  const ifOne = orderStore.getOneTrans();
  if (orderStore.ifOne) {
    foo();
    return;
  }
  Modal.confirm({
    title: "确定平仓",
    zIndex: 2,
    maskClosable: true,
    onOk() {
      foo();
    },
  });
  if (ifOne === null) {
    dialogStore.disclaimers = true;
  }
};

// 批量平仓撤单
const closeOrders = (
  data: orders.resOrders[],
  type: orderTypes.TableDataKey
) => {
  if (data.length === 0) {
    return;
  }
  const closeTipMap: Record<string, string> = {
    position: "平仓",
    order: "撤销",
  };
  const preTipMap: Record<string, string> = {
    position: "头寸",
    order: "挂单",
  };
  Modal.confirm({
    title: `${closeTipMap[type]}${preTipMap[type]}`,
    content: `您将${closeTipMap[type]}以下选定的${data.length}个${preTipMap[type]}，您想要继续吗？`,
    maskClosable: true,
    async onOk() {
      if (type === "position") {
        const list = data.map((item) => {
          return orders.marketOrdersClose({
            symbol: item.symbol,
            id: item.id,
            volume: item.volume,
          });
        });
        const res = await Promise.all(list);
        if (res[0].data.action_success) {
          message.success("平仓成功");
          getOrders();
          getTradingHistory();
          userStore.getLoginInfo();
        }
      }
      if (type === "order") {
        const list = data.map((item) => {
          return orders.delPendingOrders({
            symbol: item.symbol,
            id: item.id,
          });
        });
        const res = await Promise.all(list);
        if (res[0].data.action_success) {
          message.success("撤销挂单成功");
          getPendingOrders();
          getOrderHistory();
        }
      }
    },
  });
};

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

  const ifOne = orderStore.getOneTrans();
  if (ifOne === null) {
    dialogStore.disclaimers = true;
  }

  if (!orderStore.ifOne) {
    Modal.confirm({
      title: "确定撤销",
      zIndex: 1,
      maskClosable: true,
      onOk() {
        foo();
      },
    });
    return;
  }
  foo();
};

// 双击行
const handleRowDoubleClick = (record: orders.resOrders) => {
  if (activeKey.value === "position") {
    state.orderInfo = record;
    state.closeDialogVisible = true;
  }
};
const getQuote = () => {
  if (state.orderInfo.symbol) {
    return orderStore.currentQuotes[state.orderInfo.symbol];
  }
  return {
    ask: 0,
    bid: 0,
    ctm: 0,
    ctm_ms: 0,
    server: "",
    symbol: "",
  };
};

const getTableDate = (type: string) => {
  switch (type) {
    case "position":
      debouncedGetOrders();
      break;
    case "order":
      debouncedGetPendingOrders();
      break;
    case "orderHistory":
      debouncedGetOrderHistory();
      break;
    case "transactionHistory":
      debouncedGetTradingHistory();
      break;
    default:
      break;
  }
};

const container = ref();
const tableY = ref("");
let observer: ResizeObserver | null = null;
onMounted(async () => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { height } = entry.contentRect;
      tableY.value = `${height - 40 - 24 - 24 - 20}px`;
    }
  });
  observer.observe(container.value);
  await Promise.all([
    debouncedGetOrders(),
    debouncedGetPendingOrders(),
    debouncedGetTradingHistory(),
    debouncedGetOrderHistory(),
  ]);
  socketStore.orderChanges(async (type: string) => {
    switch (type) {
      case "order_opened":
        await getOrders();
        await userStore.getLoginInfo();
        break;
      case "order_closed":
        await getOrders();
        await getTradingHistory();
        await userStore.getLoginInfo();
        break;
      case "order_modified":
        await getOrders();
        break;
      case "pending_order_opened":
      case "pending_order_modified":
        await getPendingOrders();
        break;
      case "pending_order_deleted":
        await getPendingOrders();
        await getOrderHistory();
        break;
      case "pending_order_dealt":
        await getOrders();
        await getPendingOrders();
        await userStore.getLoginInfo();
        break;
      case "balance_order_added":
        await userStore.getLoginInfo();
        break;
      default:
        break;
    }
    filterData();
  });
  filterData();
});
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.ant-table-wrapper {
  @include border_color("border");
  border: 1px solid;
}

.orderArea {
  box-sizing: border-box;
  border-radius: 5px;
  max-width: calc(100% - 16px);
  float: right;

  &_header {
    display: flex;
    border-bottom: 1px solid;
    @include border_color("border");
    box-sizing: border-box;
    width: 100%;
    justify-content: space-between;
    padding-right: 16px;
    align-items: center;
  }

  .container {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding-right: 16px;
    height: calc(100% - 25px - 24px);

    .filter {
      height: 40px;
      display: flex;
      gap: 8px;
      box-sizing: border-box;
      align-items: center;

      .closeBtn {
        margin-left: auto;
      }
    }
  }
}
</style>
