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
            <BaseImg class="logo" iconName="icon_17" />
            <el-text type="info">{{ $t("feedback") }}</el-text>
          </div>
        </div>
      </div>
    </HorizontalScrolling>
    <div class="container" ref="container">
      <HorizontalScrolling style="margin-bottom: 8px">
        <div class="filter">
          <SymbolSelect
            v-if="activeKey !== 'blanceRecord'"
            style="width: 200px; flex-shrink: 0; height: 32px"
            v-model="orderStore.dataFilter[activeKey].symbol"
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
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'marketOrder'"
            v-model="orderStore.dataFilter[activeKey].direction"
            clearable
            placeholder="方向"
          >
            <el-option value="buy" :label="$t('order.buy')"></el-option>
            <el-option value="sell" :label="$t('order.sell')"></el-option>
          </el-select>
          <el-select
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'marketOrder'"
            v-model="orderStore.dataFilter[activeKey].pol"
            clearable
            placeholder="盈亏"
          >
            <el-option value="profit" label="盈利"></el-option>
            <el-option value="loss" label="亏损"></el-option>
          </el-select>
          <TimeSelect
            v-show="activeKey === 'pendingOrderHistory'"
            v-model:value="orderStore.dataFilter[activeKey].createTime"
            style="width: 380px"
            :pickerOption="{
              startPlaceholder: '创建开始时间',
              endPlaceholder: '创建结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >创建时间：</TimeSelect
          >
          <TimeSelect
            v-show="['marketOrderHistory'].includes(activeKey)"
            style="width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].addTime"
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
            style="width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].closeTime"
            :pickerOption="{
              startPlaceholder: '平仓开始时间',
              endPlaceholder: '平仓结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >平仓时间：</TimeSelect
          >
          <TimeSelect
            v-show="['blanceRecord'].includes(activeKey)"
            style="width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].createTime"
            :pickerOption="{
              startPlaceholder: '开始时间',
              endPlaceholder: '结束时间',
            }"
            @timeRange="getTableDate(activeKey)"
            >时间：</TimeSelect
          >
          <el-select
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'blanceRecord'"
            v-model="orderStore.dataFilter[activeKey].pol"
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
              <el-button type="primary">
                <span class="label">批量平仓</span>
                <BaseImg class="caretDownIcon" iconName="caretDown" />
              </el-button>
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
              type="primary"
              v-show="activeKey === 'pendingOrder'"
              @click="closePendingOrders(orderStore.orderData.pendingOrder)"
              >全部撤单</el-button
            >
          </div>
        </div>
      </HorizontalScrolling>

      <el-auto-resizer :style="{ height: boxH }">
        <template #default="{ height, width }">
          <el-table-v2
            :key="activeKey"
            header-class="table_v2_Header"
            v-loading="orderStore.dataLoading[activeKey]"
            :columns="state.columns[activeKey]"
            :data="dataSource"
            :row-height="32"
            :header-height="32"
            :cell-props="{
              style: { padding: '0 16px' },
            }"
            :width="width"
            :height="getTableHeight(height)"
            :footer-height="
              pageLoading ||
              ['marketOrderHistory', 'blanceRecord'].includes(activeKey)
                ? 32
                : 0
            "
            :row-props="rowProps"
            @end-reached="endReached"
            @scroll="tableScroll"
            fixed
          >
            <template #header-cell="{ column }">
              <div class="header-box">
                <div>{{ column.title || "" }}</div>
                <div
                  class="drag-line"
                  v-if="column.key !== 'action'"
                  @mousedown="(e: Event) => mousedown(e, column.dataKey)"
                >
                  |
                </div>
              </div>
            </template>
            <template #cell="{ column, rowData }">
              <template v-if="column.dataKey.includes('time')">{{
                formatTime(rowData[column.dataKey])
              }}</template>
              <template v-else-if="column.dataKey === 'volume'"
                >{{ rowData.volume / 100 }}手</template
              >
              <template v-else-if="column.dataKey === 'type'">
                <span
                  :class="[rowData.type % 2 === 0 ? 'buyWord' : 'sellWord']"
                  >{{ $t(`order.${getTradingDirection(rowData.type)}`) }}</span
                >
              </template>
              <template v-else-if="column.dataKey === 'orderType'">
                <span
                  :class="[rowData.type % 2 === 0 ? 'buyWord' : 'sellWord']"
                  >{{ getOrderType(rowData.type) }}</span
                ></template
              >
              <template v-else-if="column.dataKey === 'now_price'">{{
                getNowPrice(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'order_price'">{{
                getOrderPrice(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'profit'">
                <span :class="[getCellClass(rowData.profit), 'profitcell']">
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
              <template v-else-if="column.dataKey === 'close_type'">{{
                getCloseType(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'days'">{{
                getDays(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'comment'">
                <el-tooltip :content="rowData.comment" placement="top">
                  <span class="textEllipsis">{{ rowData.comment || "-" }}</span>
                </el-tooltip>
              </template>
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
                  class="blaRecFooter"
                  v-if="!pageLoading && activeKey === 'blanceRecord'"
                >
                  <span class="blaRecFooter_item">
                    <el-text type="info">净入金：</el-text>
                    <el-text>{{ netDeposit }}</el-text>
                  </span>
                  <span class="blaRecFooter_item">
                    <el-text type="info"
                      >累计入金（{{ accDeposit.len }}笔）：</el-text
                    >
                    <el-text>{{ accDeposit.sum }}</el-text>
                  </span>
                  <span class="blaRecFooter_item">
                    <el-text type="info"
                      >累计出金（{{ accWithdrawal.len }}笔）：</el-text
                    >
                    <el-text>{{ accWithdrawal.sum }}</el-text>
                  </span>
                </div>
                <div
                  class="MOHFooter"
                  :style="{ width: MOHFWidth }"
                  v-if="!pageLoading && activeKey === 'marketOrderHistory'"
                >
                  <el-text type="info">合计：</el-text>
                  <span :class="[getCellClass(+MOHProSum)]">
                    {{ MOHProSum }}</span
                  >
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
import { CloseBold } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { cloneDeep, minBy, set } from "lodash";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import * as orderTypes from "#/order";
import { CLOSE_TYPE } from "@/constants/common";
import * as orders from "api/order/index";
import { getOrderType, getTradingDirection } from "utils/order/index";
import { tableColumns } from "./config";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useTime } from "@/store/modules/time";
import { useUser } from "@/store/modules/user";

import SelectSuffixIcon from "@/components/SelectSuffixIcon.vue";
import MarketOrderEdit from "../orderDialog/MarketOrderEdit.vue";
import PendingOrderEdit from "../orderDialog/PendingOrderEdit.vue";
import TimeSelect from "./components/TimeSelect.vue";

const { t } = useI18n();

const userStore = useUser();
const orderStore = useOrder();
const dialogStore = useDialog();
const timeStore = useTime();

const state = reactive({
  menu: [
    { label: "持仓", key: "marketOrder" },
    { label: "挂单", key: "pendingOrder" },
    // { label: "交易历史", key: "marketOrderHistory" },
    { label: "历史", key: "marketOrderHistory" },
    // { label: "挂单历史", key: "pendingOrderHistory" },
    { label: "失效", key: "pendingOrderHistory" },
    { label: "出入金记录", key: "blanceRecord" },
  ],
  columns: cloneDeep(tableColumns),
  marketDialogVisible: false,
  pendingDialogVisible: false,
  orderInfo: {} as orders.resOrders & orders.resPendingOrders,
});
const activeKey = ref<orderTypes.TableDataKey>("marketOrder");

// 拖动改变列宽相关逻辑
const columnRefresh = (x: any, fileKey: string) => {
  const index = state.columns[activeKey.value].findIndex(
    (item: any) => item.dataKey === fileKey
  );
  const nowCol = state.columns[activeKey.value][index];
  const minNowW = nowCol.minWidth || 80;
  // 向左
  if (x < 0 && nowCol.width <= minNowW) {
    return;
  }
  const nowW = nowCol.width + x;
  nowCol.width = Math.max(nowW, minNowW);
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

const getTableHeight = (height: number) => {
  return ["marketOrderHistory"].includes(activeKey.value)
    ? Math.min((dataSource.value.length + 2) * 32, height)
    : height;
};

// 出入金记录底部合计
import { accAdd } from "utils/arithmetic";
const profits = computed(() => {
  return (orderStore.orderData.blanceRecord || []).map((item) => item.profit);
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
const dataSource = computed(() => {
  const active = activeKey.value;
  const originData = cloneDeep(orderStore.orderData[active]);
  const selectSymbols = orderStore.dataFilter[active].symbol || [];
  const direction = orderStore.dataFilter[active].direction;
  const pol = orderStore.dataFilter[active].pol;
  let result: orders.resOrders[] = [];
  if (originData) {
    result = originData.filter((item) => {
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
  return result;
});

// 平仓类型
const getCloseType = (e: orders.resHistoryOrders) => {
  const { close_type } = e;
  if (close_type !== undefined) {
    const result = CLOSE_TYPE[close_type];
    return result ? t(`order.${result}`) : close_type;
  }
  return "-";
};

// 格式化表格时间字段
import dayjs from "dayjs";
const formatTime = (timestamp: string) => {
  const timezone = timeStore.settedTimezone;
  const result = dayjs(timestamp).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
  return result;
};

// 获取现价
const getNowPrice = (e: orders.resOrders) => {
  try {
    const currentQuote = orderStore.currentQuotes[e.symbol];
    const type = getTradingDirection(e.type);
    const result = type === "buy" ? currentQuote.bid : currentQuote.ask;
    const id = e.id;
    const data = orderStore.orderData[activeKey.value];
    if (data) {
      const index = data.findIndex((e) => e.id === id);
      if (index) {
        set(data, [index, "now_price"], +result);
      }
    }
    if (e.digits) {
      return result.toFixed(e.digits);
    }
    return result;
  } catch (error) {
    return "-";
  }
};

// 挂单价格
const getOrderPrice = (e: orders.resPendingOrders) => {
  if ([6, 7].includes(e.type)) {
    return e.order_price_time ? e.trigger_price : e.order_price;
  }
  return e.order_price;
};

// 获取盈亏
import { useRate } from "@/store/modules/rate";
import { watch } from "vue";
const rateStore = useRate();
const getProfit = (e: orders.resOrders) => {
  try {
    let result: string | number = "";
    const type = getTradingDirection(e.type);
    const currentQuote = orderStore.currentQuotes[e.symbol];
    // 持仓多单时，close_price = 现价卖价
    // 持仓空单时，close_price = 现价买价
    const closePrice = type === "buy" ? currentQuote.bid : currentQuote.ask;
    const rateMap = rateStore.getSymbolRate(e.symbol);
    const rate = type === "buy" ? rateMap.ask_rate : rateMap.bid_rate;
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
    result = ((direction + (storage || 0) + (fee || 0)) * rate).toFixed(2);
    e.profit = +result;
    const data = orderStore.orderData[activeKey.value];
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

// 交易历史盈亏合计位置
const MOHFWidth = ref("");
const tableXScroll = ref(0);
watch(
  () => [state.columns.marketOrderHistory, tableXScroll, activeKey],
  () => {
    const list = state.columns.marketOrderHistory;
    const cell = document.querySelector(".profitcell");
    if (cell) {
      const cellRight = cell.getBoundingClientRect().right;
      MOHFWidth.value = cellRight + "px";
    } else {
      const index = list.findIndex((e) => e.dataKey === "profit");
      const targetList = list.slice(0, index + 1);
      const width = targetList.reduce((pre, next) => {
        return pre + next.width;
      }, 0);
      MOHFWidth.value = width - tableXScroll.value + "px";
    }
  },
  { deep: true, flush: "post" }
);
type ScrollParams = {
  xAxisScrollDir: "forward" | "backward";
  scrollLeft: number;
  yAxisScrollDir: "forward" | "backward";
  scrollTop: number;
};
const tableScroll = (e: ScrollParams) => {
  if (activeKey.value !== "marketOrderHistory") {
    tableXScroll.value = 0;
    return;
  }
  tableXScroll.value = e.scrollLeft;
};
// 交易历史盈亏合计
const MOHProSum = computed(() => {
  const sum = dataSource.value.reduce((pre, next) => {
    return pre + next.profit;
  }, 0);
  return sum.toFixed(2);
});

// 持仓天数
const getDays = (e: orders.resHistoryOrders) => {
  const timeDone = e.time_done || dayjs().valueOf();
  const openTime = e.open_time;
  const date1 = dayjs(openTime);
  const date2 = dayjs(timeDone);
  const daysDifference = date2.diff(date1, "days");
  return +daysDifference;
};

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
      orderStore.getMarketOrders();
      orderStore.getMarketOrderHistory();
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
      orderStore.getPendingOrders();
      orderStore.getPendingOrderHistory();
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
      orderStore.getPendingOrders();
      orderStore.getPendingOrderHistory();
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
      if (activeKey.value === "marketOrder") {
        state.marketDialogVisible = true;
      }
      if (activeKey.value === "pendingOrder") {
        state.pendingDialogVisible = true;
      }
      state.orderInfo = rowData;
    },
  };
};

// 到底触发(持仓历史，挂单历史，出入金分页)
const pageLoading = ref(false);
const endReached = async () => {
  const nowData = orderStore.orderData[activeKey.value];
  const minId = minBy(nowData, "id")?.id;
  if (
    !minId ||
    orderStore.dataEnding[activeKey.value] ||
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
        await orderStore.getMarketOrderHistory(minId);
        break;
      case "pendingOrderHistory":
        await orderStore.getPendingOrderHistory(minId);
        break;
      case "blanceRecord":
        await orderStore.getBlanceRecord(minId);
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
      orderStore.getMarketOrders();
      break;
    case "pendingOrder":
      orderStore.getPendingOrders();
      break;
    case "pendingOrderHistory":
      orderStore.getPendingOrderHistory();
      break;
    case "marketOrderHistory":
      orderStore.getMarketOrderHistory();
      break;
    case "blanceRecord":
      orderStore.getBlanceRecord();
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
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

:deep(.el-table-v2__header-cell) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0;
}
.orderArea {
  box-sizing: border-box;
  border-radius: 5px;
  width: 100%;
  @include background_color("background-component");

  .header {
    display: flex;
    box-sizing: border-box;
    width: 100%;
    height: var(--size);
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
        @include font_color("word-gray");
        cursor: pointer;
        align-items: center;
        &:hover {
          @include font_color("primary");
        }
      }
    }
  }

  .container {
    box-sizing: border-box;
    height: calc(100% - 48px);
    padding: 8px;
    border: 4px solid;
    border-bottom: none;
    border-radius: 4px;
    margin: 0 4px 4px 4px;
    @include border_color("background-component");
    @include background_color("background");

    .filter {
      min-height: 32px;
      display: flex;
      gap: 8px;

      .rightOpera {
        flex: 1;
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}
.header-box {
  position: relative;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  @include background_color("table-colored");
  height: 100%;
  width: 100%;
  padding: 0 16px;
  line-height: 32px;
  font-weight: 400;

  .drag-line {
    position: absolute;
    top: 0;
    right: 0;
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
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  .loading {
    animation: rotate 1s linear infinite;
  }
}
.blaRecFooter {
  height: 32px;
  display: flex;
  align-items: center;
  &_item {
    padding: 0 15px;
    min-width: 150px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
    border-right: 2px solid;
    @include border_color("border");
  }
}
.MOHFooter {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 16px;
}
</style>
