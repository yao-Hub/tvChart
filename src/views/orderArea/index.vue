<template>
  <div class="orderArea">
    <HorizontalScrolling>
      <div class="header">
        <baseTabs v-model:activeKey="activeKey">
          <TabItem
            v-for="item in state.menu"
            :value="item.key"
            :tab="item.label"
          >
          </TabItem>
        </baseTabs>
        <div class="header_right">
          <div
            class="feedback textEllipsis"
            @click="dialogStore.feedbackVisible = true"
          >
            <img class="logo" src="@/assets/icons/icon_16.svg" />
            <span class="label">{{ $t("feedback") }}</span>
          </div>
        </div>
      </div>
    </HorizontalScrolling>
    <div class="container" ref="container">
      <HorizontalScrolling>
        <div class="filter">
          <SymbolSelect
            v-if="activeKey !== 'blanceRecord'"
            style="width: 190px; flex-shrink: 0; height: 32px"
            v-model="state.updata[activeKey].symbol"
            :selectOption="{
              multiple: true,
              collapseTags: true,
              collapseTagsTooltip: true,
              filterable: true,
              clearable: true,
            }"
          >
          </SymbolSelect>
          <el-select
            style="width: 130px; flex-shrink: 0; height: 32px"
            v-if="activeKey === 'marketOrder'"
            v-model="state.updata[activeKey].direction"
            clearable
            placeholder="方向"
          >
            <el-option value="buy" :label="$t('order.buy')"></el-option>
            <el-option value="sell" :label="$t('order.sell')"></el-option>
          </el-select>
          <el-select
            style="width: 130px; flex-shrink: 0; height: 32px"
            v-if="activeKey === 'marketOrder'"
            v-model="state.updata[activeKey].pol"
            clearable
            placeholder="盈亏"
          >
            <el-option value="profit" label="盈利"></el-option>
            <el-option value="loss" label="亏损"></el-option>
          </el-select>
          <TimeSelect
            v-show="activeKey === 'pendingOrderHistory'"
            v-model:value="state.updata[activeKey].createTime"
            style="width: 380px; flex-shrink: 0"
            :pickerOption="{
              startPlaceholder: '创建开始时间',
              endPlaceholder: '创建结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >创建时间：</TimeSelect
          >
          <TimeSelect
            v-show="['marketOrderHistory'].includes(activeKey)"
            style="width: 380px; flex-shrink: 0"
            v-model:value="state.updata[activeKey].addTime"
            :pickerOption="{
              startPlaceholder: '建仓开始时间',
              endPlaceholder: '建仓结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >建仓时间：</TimeSelect
          >
          <TimeSelect
            v-show="['marketOrderHistory'].includes(activeKey)"
            initFill
            style="width: 380px; flex-shrink: 0"
            v-model:value="state.updata[activeKey].closeTime"
            :pickerOption="{
              startPlaceholder: '平仓开始时间',
              endPlaceholder: '平仓结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >平仓时间：</TimeSelect
          >
          <TimeSelect
            v-show="['blanceRecord'].includes(activeKey)"
            style="width: 380px; flex-shrink: 0"
            v-model:value="state.updata[activeKey].createTime"
            :pickerOption="{
              startPlaceholder: '开始时间',
              endPlaceholder: '结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >时间：</TimeSelect
          >
          <el-select
            style="width: 130px; flex-shrink: 0; height: 32px"
            v-if="activeKey === 'blanceRecord'"
            v-model="state.updata[activeKey].pol"
            clearable
            placeholder="类型"
          >
            <el-option value="profit" label="入金"></el-option>
            <el-option value="loss" label="出金"></el-option>
          </el-select>
          <div class="rightOpera">
            <el-dropdown
              trigger="click"
              v-if="['marketOrder'].includes(activeKey)"
              @command="closeMarketOrders"
            >
              <div class="delList">
                <span>批量平仓</span>
                <el-icon>
                  <arrow-down />
                </el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">所有持仓平仓</el-dropdown-item>
                  <el-dropdown-item :command="2">所有多单平仓</el-dropdown-item>
                  <el-dropdown-item :command="3">所有空单平仓</el-dropdown-item>
                  <el-dropdown-item :command="4">盈利持仓平仓</el-dropdown-item>
                  <el-dropdown-item :command="5">亏损持仓平仓</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              size="small"
              type="primary"
              v-show="activeKey === 'pendingOrder'"
              @click="closePendingOrders(state.dataSource.pendingOrder)"
              >全部撤单</el-button
            >
          </div>
        </div>
      </HorizontalScrolling>

      <el-auto-resizer :style="{ height: boxH }">
        <template #default="{ height, width }">
          <el-table-v2
            :key="activeKey"
            header-class="tableHeader"
            v-loading="state.loadingList[activeKey]"
            :columns="state.columns[activeKey]"
            :data="state.dataSource[activeKey]"
            :row-height="32"
            :header-height="32"
            :width="width"
            :height="parseInt(height)"
            :footer-height="
              pageLoading || activeKey === 'blanceRecord' ? 32 : 0
            "
            :row-props="rowProps"
            @end-reached="endReached"
            fixed
          >
            <template #header-cell="{ column }">
              <div
                class="header-box"
                @dragenter="(e: Event) => e.preventDefault()"
                @dragover="(e: Event) => e.preventDefault()"
              >
                <div>{{ column.title || "" }}</div>
                <div
                  class="drag-line"
                  @mousedown="(e: Event) => mousedown(e, column.dataKey)"
                >
                  |
                </div>
              </div>
            </template>
            <template #cell="{ column, rowData }">
              <template v-if="column.dataKey === 'time_setup'">{{
                formatTime(rowData.time_setup)
              }}</template>
              <template v-else-if="column.dataKey === 'time_expiration'">{{
                formatTime(rowData.time_expiration)
              }}</template>
              <template v-else-if="column.dataKey === 'time_done'">{{
                formatTime(rowData.time_done)
              }}</template>
              <template v-else-if="column.dataKey === 'volume'"
                >{{ rowData.volume / 100 }}手</template
              >
              <template v-else-if="column.dataKey === 'type'">{{
                $t(`order.${getTradingDirection(rowData.type)}`)
              }}</template>
              <template v-else-if="column.dataKey === 'orderType'">{{
                getOrderType(rowData.type)
              }}</template>
              <template v-else-if="column.dataKey === 'now_price'">{{
                getNowPrice(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'order_price'">{{
                rowData.order_price_time
                  ? rowData.trigger_price
                  : rowData.order_price
              }}</template>
              <template v-else-if="column.dataKey === 'profit'">
                <span :class="[getCellClass(rowData.profit)]">
                  <span v-if="activeKey === 'marketOrder'">{{
                    getProfit(rowData)
                  }}</span>
                  <span v-else-if="activeKey === 'blanceRecord'">{{
                    rowData.profit > 0 ? `+${rowData.profit}` : rowData.profit
                  }}</span>
                  <span v-else>{{ rowData.profit }}</span>
                </span>
              </template>
              <template v-else-if="column.dataKey === 'blanceType'">
                <span>{{ rowData.profit > 0 ? "入金" : "出金" }}</span>
              </template>
              <template v-else-if="column.dataKey === 'storage'">
                <span :class="[getCellClass(rowData.storage)]">{{
                  rowData.storage
                }}</span>
              </template>
              <template v-else-if="column.dataKey === 'fee'">
                <span :class="[getCellClass(rowData.fee)]">{{
                  rowData.fee
                }}</span>
              </template>
              <template v-else-if="column.dataKey === 'distance'">{{
                getDistance(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'close_type'">{{
                getCloseType(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'days'">{{
                getDays(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'positionAction'">
                <el-tooltip content="平仓" placement="top">
                  <el-icon class="iconfont" @click="closeMarketOrder(rowData)">
                    <CloseBold />
                  </el-icon>
                </el-tooltip>
              </template>
              <template v-else-if="column.dataKey === 'orderAction'">
                <el-tooltip content="撤销" placement="top">
                  <el-icon class="iconfont" @click="delPendingOrder(rowData)">
                    <CloseBold />
                  </el-icon>
                </el-tooltip>
              </template>
              <template v-else>
                {{
                  [null, undefined, ""].includes(rowData[column.dataKey])
                    ? "-"
                    : rowData[column.dataKey]
                }}
              </template>
            </template>
            <template #footer>
              <el-scrollbar>
                <div class="loadingFooter" v-if="pageLoading">
                  <el-icon class="loading"><Loading /></el-icon>
                </div>
                <div
                  class="tableFooter"
                  v-if="!pageLoading && activeKey === 'blanceRecord'"
                >
                  <span class="item">
                    <span class="label">净入金：</span>
                    <span class="value">{{ netDeposit }}</span>
                  </span>
                  <span class="item">
                    <span class="label"
                      >累计入金（{{ accDeposit.len }}笔）：</span
                    >
                    <span class="value">{{ accDeposit.sum }}</span>
                  </span>
                  <span class="item">
                    <span class="label"
                      >累计出金（{{ accWithdrawal.len }}笔）：</span
                    >
                    <span class="value">{{ accWithdrawal.sum }}</span>
                  </span>
                </div>
              </el-scrollbar>
            </template>
          </el-table-v2>
        </template>
      </el-auto-resizer>
    </div>
    <MarketOrderEdit
      v-model:visible="state.marketDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="getQuote()"
    >
    </MarketOrderEdit>

    <PendingOrderEdit
      v-model:visible="state.pendingDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="getQuote()"
    >
    </PendingOrderEdit>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch, computed } from "vue";
import { cloneDeep, debounce, set, minBy } from "lodash";
import { CloseBold } from "@element-plus/icons-vue";
import { ElMessageBox, ElMessage } from "element-plus";

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

import MarketOrderEdit from "../orderDialog/MarketOrderEdit.vue";
import PendingOrderEdit from "../orderDialog/PendingOrderEdit.vue";

import TimeSelect from "./components/TimeSelect.vue";

const userStore = useUser();
const orderStore = useOrder();
const dialogStore = useDialog();
const socketStore = useSocket();

const state = reactive({
  menu: [
    { label: "持仓", key: "marketOrder" },
    { label: "挂单", key: "pendingOrder" },
    { label: "历史持仓", key: "marketOrderHistory" },
    { label: "历史挂单", key: "pendingOrderHistory" },
    { label: "出入金记录", key: "blanceRecord" },
  ],
  columns: tableColumns,
  dataSource: {
    marketOrder: [],
    pendingOrder: [],
    pendingOrderHistory: [],
    marketOrderHistory: [],
    blanceRecord: [],
  } as Record<orderTypes.TableDataKey, orders.resOrders[]>,
  marketDialogVisible: false,
  pendingDialogVisible: false,
  orderInfo: {} as orders.resOrders,
  updata: {
    marketOrder: {
      symbol: [],
      direction: null,
      pol: null,
      createTime: [],
      addTime: [],
      closeTime: [],
    },
    pendingOrder: {
      symbol: [],
      createTime: [],
      addTime: [],
      closeTime: [],
    },
    pendingOrderHistory: {
      symbol: [],
      createTime: [],
      addTime: [],
      closeTime: [],
    },
    marketOrderHistory: {
      symbol: [],
      createTime: [],
      addTime: [],
      closeTime: [],
    },
    blanceRecord: {
      createTime: [],
      pol: null,
    },
  } as Record<orderTypes.TableDataKey, any>,
  loadingList: {
    marketOrder: false,
    pendingOrder: false,
    pendingOrderHistory: false,
    marketOrderHistory: false,
    blanceRecord: false,
  },
  ending: {
    marketOrder: false,
    pendingOrder: false,
    pendingOrderHistory: false,
    marketOrderHistory: false,
    blanceRecord: false,
  },
});
const activeKey = ref<orderTypes.TableDataKey>("marketOrder");

// 拖动改变列宽相关逻辑
const columnRefresh = (x: any, fileKey: string) => {
  const index = state.columns[activeKey.value].findIndex(
    (item: any) => item.dataKey === fileKey
  );
  const nextIndex = index + 1;
  const nowCol = state.columns[activeKey.value][index];
  const nextCol = state.columns[activeKey.value][nextIndex];
  const minNowW = nowCol.minWidth || 80;
  const minNextW = nextCol.minWidth || 80;
  // 向左
  if (x < 0 && nowCol.width <= minNowW) {
    return;
  }
  // 向右
  if (x > 0 && nextCol.width <= minNextW) {
    return;
  }
  const nowW = nowCol.width + x;
  const nextW = nextCol.width - x;
  nowCol.width = Math.max(nowW, minNowW);
  nextCol.width = Math.max(nextW, minNextW);
};

let isResizing = false;
let lastX = 0;
let currentKey = "";
const mousedown = (e: any, dataKey: string) => {
  isResizing = true;
  lastX = e.clientX;
  currentKey = dataKey;
};
document.addEventListener("mousemove", (e) => {
  if (isResizing) {
    const offsetX = e.clientX - lastX;
    columnRefresh(offsetX, currentKey);
    lastX = e.clientX;
  }
});
document.addEventListener("mouseup", () => {
  isResizing = false;
});

import { accAdd } from "utils/arithmetic";
const profits = computed(() => {
  return (orderStore.tableData.blanceRecord || []).map((item) => item.profit);
});
// 净入金：
const netDeposit = computed(() => {
  return profits.value.reduce((pre, next) => {
    return accAdd(pre, next);
  }, 0);
});
// 累计入金：
const accDeposit = computed(() => {
  const list = profits.value.filter((item) => +item > 0);
  const sum = list.reduce((pre, next) => {
    return accAdd(pre, next);
  }, 0);
  return {
    len: list.length,
    sum,
  };
});
// 累计出金（笔）：
const accWithdrawal = computed(() => {
  const list = profits.value.filter((item) => +item < 0);
  const sum = list.reduce((pre, next) => {
    return accAdd(pre, next);
  }, 0);
  return {
    len: list.length,
    sum,
  };
});

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
  const selectSymbols = state.updata[active].symbol || [];
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
  debounce(() => filterData(), 100)
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
    return CLOSE_TYPE[close_type] || close_type;
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

// 查询持仓
const getMarketOrders = async () => {
  try {
    state.loadingList.marketOrder = true;
    const res = await orders.openningOrders();
    if (res.data) {
      res.data = res.data.map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      state.dataSource.marketOrder = cloneDeep(res.data);
      orderStore.tableData.marketOrder = cloneDeep(res.data);
    }
  } finally {
    state.loadingList.marketOrder = false;
  }
};

// 查询挂单（有效）
const getPendingOrders = async () => {
  try {
    state.loadingList.pendingOrder = true;
    const res = await orders.pendingOrders();
    if (res.data) {
      res.data = res.data.map((item, index) => {
        return {
          ...item,
          key: index,
        };
      });
      state.dataSource.pendingOrder = cloneDeep(res.data);
      orderStore.tableData.pendingOrder = cloneDeep(res.data);
    }
  } finally {
    state.loadingList.pendingOrder = false;
  }
};

// 查询挂单历史（失效）
const getPendingOrderHistory = async (limit_id?: number) => {
  try {
    state.loadingList.pendingOrderHistory = true;
    const [begin_time, end_time] = state.updata.pendingOrderHistory.createTime;
    const updata: any = {
      count: 200,
      limit_id,
    };
    updata.begin_time = begin_time;
    updata.end_time = end_time;
    const res = await orders.invalidPendingOrders(updata);
    res.data = res.data.map((item, index) => {
      return {
        ...item,
        key: index,
      };
    });
    if (limit_id) {
      state.dataSource.pendingOrderHistory.push(...res.data);
    } else {
      state.dataSource.pendingOrderHistory = res.data;
    }
    state.ending.pendingOrderHistory = !res.data.length;
  } finally {
    state.loadingList.pendingOrderHistory = false;
  }
};

// 查询交易历史
const getMarketOrderHistory = async (limit_id?: number) => {
  try {
    state.loadingList.marketOrderHistory = true;
    const { addTime, closeTime } = state.updata.marketOrderHistory;
    const [open_begin_time, open_end_time] = addTime;
    const [close_begin_time, close_end_time] = closeTime;
    const updata: any = {
      count: 200,
      limit_id,
    };
    updata.open_begin_time = open_begin_time;
    updata.open_end_time = open_end_time;
    updata.close_begin_time = close_begin_time;
    updata.close_end_time = close_end_time;
    const res = await orders.historyOrders(updata || {});
    res.data = res.data.map((item, index) => {
      return {
        ...item,
        key: index,
      };
    });
    if (limit_id) {
      state.dataSource.marketOrderHistory.push(...res.data);
    } else {
      state.dataSource.marketOrderHistory = res.data;
    }
    state.ending.marketOrderHistory = !res.data.length;
  } finally {
    state.loadingList.marketOrderHistory = false;
  }
};

// 查询出入金记录
const getBlanceRecord = async (limit_id?: number) => {
  try {
    state.loadingList.blanceRecord = true;
    const { createTime } = state.updata.blanceRecord;
    const [setup_begin_time, setup_end_time] = createTime;
    const updata: any = {
      types: [18],
      setup_begin_time,
      setup_end_time,
      count: 200,
      limit_id,
    };
    const res = await orders.historyOrders(updata);
    res.data = res.data.map((item, index) => {
      return {
        ...item,
        key: index,
      };
    });
    if (limit_id) {
      state.dataSource.blanceRecord.push(...res.data);
    } else {
      state.dataSource.blanceRecord = res.data;
    }
    state.ending.blanceRecord = !res.data.length;
    orderStore.tableData.blanceRecord = cloneDeep(
      state.dataSource.blanceRecord
    );
  } finally {
    state.loadingList.blanceRecord = false;
  }
};

const debouncedGetMarketOrders = debounce(() => getMarketOrders(), 200);
const debouncedGetPendingOrders = debounce(() => getPendingOrders(), 200);
const debouncedGetPendingOrderHistory = debounce(
  (limit_id?: number) => getPendingOrderHistory(limit_id),
  200
);
const debouncedGetMarketOrderHistory = debounce(
  (limit_id?: number) => getMarketOrderHistory(limit_id),
  200
);
const debouncedGetBlanceRecord = debounce(
  (limit_id?: number) => getBlanceRecord(limit_id),
  200
);

// 市价单 单个平仓
const closeMarketOrder = async (record: orders.resOrders) => {
  async function foo() {
    const res = await orders.marketOrdersClose({
      symbol: record.symbol,
      id: record.id,
      volume: record.volume,
    });
    if (res.data.action_success) {
      ElMessage.success("平仓成功");
      debouncedGetMarketOrders();
      debouncedGetMarketOrderHistory();
      userStore.getLoginInfo();
    }
  }

  const ifOne = orderStore.getOneTrans();
  if (orderStore.ifOne) {
    foo();
    return;
  }
  ElMessageBox.confirm("", "确定平仓").then(() => foo());
  if (ifOne === null) {
    dialogStore.disclaimers = true;
  }
};

const closeMarketOrders = (command: number) => {
  ElMessageBox.confirm("确定平仓").then(async () => {
    await orders.marketOrdersCloseMulti({ multi_type: command });
    ElMessage.success("平仓成功");
  });
};

// 批量撤单
const closePendingOrders = (data: orders.resOrders[]) => {
  if (data.length === 0) {
    return;
  }
  ElMessageBox.confirm(
    `您将撤销以下选定的${data.length}个挂单，您想要继续吗？`,
    `撤销挂单`
  ).then(async () => {
    const list = data.map((item) => {
      return orders.delPendingOrders({
        symbol: item.symbol,
        id: item.id,
      });
    });
    const res = await Promise.all(list);
    if (res[0].data.action_success) {
      ElMessage.success("撤销挂单成功");
      debouncedGetPendingOrders();
      debouncedGetPendingOrderHistory();
    }
  });
};

// 删除单个挂单
const delPendingOrder = async (record: orders.resOrders) => {
  async function foo() {
    const res = await orders.delPendingOrders({
      id: record.id,
      symbol: record.symbol,
    });
    if (res.data.action_success) {
      ElMessage.success("撤销挂单成功");
      debouncedGetPendingOrders();
      debouncedGetPendingOrderHistory();
      return;
    }
    ElMessage.error(res.data.err_text);
  }

  const ifOne = orderStore.getOneTrans();
  if (ifOne === null) {
    dialogStore.disclaimers = true;
  }

  if (!orderStore.ifOne) {
    ElMessageBox.confirm("", "确定撤销").then(() => foo());
    return;
  }
  foo();
};

// 双击行
const rowProps = ({ rowData }: any) => {
  return {
    ondblclick: () => {
      state.orderInfo = rowData;
      if (activeKey.value === "marketOrder") {
        state.marketDialogVisible = true;
      }
      if (activeKey.value === "pendingOrder") {
        state.pendingDialogVisible = true;
      }
    },
  };
};

// 到底触发(持仓历史，挂单历史，出入金分页)
const pageLoading = ref(false);
const endReached = async () => {
  const nowData = state.dataSource[activeKey.value];
  const minId = minBy(nowData, "id")?.id;
  if (
    !minId ||
    state.ending[activeKey.value] ||
    !["marketOrderHistory", "pendingOrderHistory", "blanceRecord"].includes(
      activeKey.value
    )
  ) {
    return;
  }
  pageLoading.value = true;
  try {
    switch (activeKey.value) {
      case "marketOrderHistory":
        await debouncedGetMarketOrderHistory(minId);
        break;
      case "pendingOrderHistory":
        await debouncedGetPendingOrderHistory(minId);
        break;
      case "blanceRecord":
        await debouncedGetBlanceRecord(minId);
        break;
    }
    pageLoading.value = false;
  } catch (e) {
    pageLoading.value = false;
  }
};

const getQuote = () => {
  return orderStore.currentQuotes[state.orderInfo.symbol] || {};
};

const getTableDate = (type: string) => {
  switch (type) {
    case "marketOrder":
      debouncedGetMarketOrders();
      break;
    case "pendingOrder":
      debouncedGetPendingOrders();
      break;
    case "pendingOrderHistory":
      debouncedGetPendingOrderHistory();
      break;
    case "marketOrderHistory":
      debouncedGetMarketOrderHistory();
      break;
    case "blanceRecord":
      debouncedGetBlanceRecord();
      break;
    default:
      break;
  }
};

const container = ref();
const boxH = ref("");
let observer: ResizeObserver | null = null;
onMounted(async () => {
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const { height } = entry.contentRect;
      boxH.value = `${height - 40}px`;
    }
  });
  observer.observe(container.value);

  await Promise.all([
    debouncedGetMarketOrders(),
    debouncedGetPendingOrders(),
    debouncedGetMarketOrderHistory(),
    debouncedGetPendingOrderHistory(),
    debouncedGetBlanceRecord(),
  ]);
  filterData();

  socketStore.orderChanges(async (type: string) => {
    switch (type) {
      case "order_opened":
        await Promise.all([
          debouncedGetMarketOrders(),
          userStore.getLoginInfo(),
        ]);
        break;
      case "order_closed":
        await Promise.all([
          debouncedGetMarketOrders(),
          debouncedGetMarketOrderHistory(),
          debouncedGetBlanceRecord(),
          userStore.getLoginInfo(),
        ]);
        break;
      case "order_modified":
        await debouncedGetMarketOrders();
        break;
      case "pending_order_opened":
      case "pending_order_modified":
        await debouncedGetPendingOrders();
        break;
      case "pending_order_deleted":
        await Promise.all([
          debouncedGetPendingOrders(),
          debouncedGetPendingOrderHistory(),
        ]);
        break;
      case "pending_order_dealt":
        await Promise.all([
          debouncedGetMarketOrders(),
          debouncedGetPendingOrders(),
          userStore.getLoginInfo(),
        ]);
        break;
      case "balance_order_added":
        await Promise.all([
          debouncedGetBlanceRecord(),
          userStore.getLoginInfo(),
        ]);
        break;
      default:
        break;
    }
    filterData();
  });
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

:deep(.tableHeader) {
  font-size: var(--font-size);
  // background-color: red;
  // @include background_color("background-table-active");
  background-color: #f1f3f6;
  border-radius: 4px 4px 0px 0px;
  overflow: hidden;
}

:deep(.el-table-v2__header-cell) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

:deep(.el-table-v2__row) {
  font-size: var(--font-size);
}
:deep(.el-table-v2__row:nth-child(even)) {
  background-color: #f1f3f6;
}

.orderArea {
  box-sizing: border-box;
  border-radius: 5px;
  width: 100%;
  @include background_color("background");

  .header {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: 40px;
    &_right {
      flex: 1;
      height: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      .feedback {
        padding: 0 16px;
        display: flex;
        gap: 5px;
        font-size: var(--font-size);
        @include font_color("word-gray");
        cursor: pointer;
        align-items: center;
      }
    }
  }

  .container {
    box-sizing: border-box;
    height: calc(100% - 48px);
    margin: 4px;
    padding: 8px;
    border-radius: 4px;
    @include background_color("background-component");

    .filter {
      height: 32px;
      display: flex;
      gap: 8px;
      box-sizing: border-box;
      align-items: center;
      margin-bottom: 8px;

      .rightOpera {
        flex: 1;
        display: flex;
        justify-content: flex-end;

        .delList {
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          width: 75px;
        }
      }
    }
  }
}

.header-box {
  position: relative;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
  .drag-line {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    cursor: ew-resize;
    padding: 0 5px;
    box-sizing: border-box;
    @include font_color("border");
  }
}
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.loadingFooter {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  .loading {
    animation: rotate 1s linear infinite;
  }
}
.tableFooter {
  height: 24px;
  display: flex;
  align-items: center;
  .item {
    padding: 0 15px;
    min-width: 150px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    border-right: 2px solid;
    @include border_color("border");
    .label {
      @include font_color("word-gray");
    }
    .value {
      @include font_color("word");
      font-size: var(--font-size);
    }
  }
}
</style>
