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
            @click="dialogStore.openDialog('feedbackVisible')"
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
            v-if="['marketOrder', 'pendingOrder'].includes(activeKey)"
            v-model="orderStore.dataFilter[activeKey].direction"
            clearable
            :placeholder="t('table.direction')"
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
            :placeholder="t('table.profit')"
          >
            <el-option value="profit" :label="t('order.profit')"></el-option>
            <el-option value="loss" :label="t('order.loss')"></el-option>
          </el-select>
          <TimeSelect
            v-show="activeKey === 'pendingOrderHistory'"
            v-if:value="orderStore.dataFilter[activeKey].createTime"
            style="min-width: 380px"
            :pickerOption="{
              startPlaceholder: t('table.createStartTime'),
              endPlaceholder: t('table.createEndTime'),
            }"
            @timeChange="getTableData('pendingOrderHistory')"
            >{{ $t("table.createTime") }}：</TimeSelect
          >
          <TimeSelect
            v-if="['marketOrderHistory'].includes(activeKey)"
            style="min-width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].addTime"
            :pickerOption="{
              startPlaceholder: t('table.positionOpeningStartTime'),
              endPlaceholder: t('table.positionOpeningEndTime'),
            }"
            @timeChange="getTableData('marketOrderHistory')"
            >{{ $t("table.positionOpeningTime") }}：</TimeSelect
          >
          <TimeSelect
            v-if="['marketOrderHistory'].includes(activeKey)"
            initFill
            style="min-width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].closeTime"
            :pickerOption="{
              startPlaceholder: t('table.positionClosingStartTime'),
              endPlaceholder: t('table.positionClosingEndTime'),
            }"
            @timeChange="getTableData('marketOrderHistory')"
            >{{ $t("table.positionClosingTime") }}：</TimeSelect
          >
          <TimeSelect
            v-if="['blanceRecord'].includes(activeKey)"
            style="min-width: 380px"
            v-model:value="orderStore.dataFilter[activeKey].createTime"
            :pickerOption="{
              startPlaceholder: t('table.startTime'),
              endPlaceholder: t('table.endTime'),
            }"
            @timeChange="getTableData('blanceRecord')"
            >{{ $t("table.time") }}：</TimeSelect
          >
          <el-select
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'blanceRecord'"
            v-model="orderStore.dataFilter[activeKey].pol"
            clearable
            :placeholder="t('table.blanceType')"
          >
            <el-option value="profit" :label="t('table.deposit')"></el-option>
            <el-option value="loss" :label="t('table.withdrawal')"></el-option>
          </el-select>
          <div class="rightOpera">
            <el-dropdown
              trigger="click"
              v-if="['marketOrder'].includes(activeKey)"
              @command="closeMarketOrders"
            >
              <el-button type="primary">
                <span class="label">{{ $t("table.batchClose") }}</span>
                <BaseImg class="caretDownIcon" iconName="caretDown" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">{{
                    $t("table.allPositionsClose")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="2">{{
                    $t("table.closeAllLongPositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="3">{{
                    $t("table.closeAllShortPositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="4">{{
                    $t("table.closeProfitablePositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="5">{{
                    $t("table.closeLosingPositions")
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="primary"
              v-show="activeKey === 'pendingOrder'"
              @click="closePendingOrders(orderStore.orderData.pendingOrder)"
              >{{ $t("table.cancelAllOrders") }}</el-button
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
                >{{ rowData.volume / 100 }}{{ $t("table.lot") }}</template
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
                <span
                  :class="[
                    getCellClass(getMarketOrderProfit(rowData)),
                    'profitcell',
                  ]"
                >
                  <span v-if="activeKey === 'marketOrder'">{{
                    getMarketOrderProfit(rowData)
                  }}</span>
                  <span v-else-if="activeKey === 'blanceRecord'">{{
                    rowData.profit > 0 ? `+${rowData.profit}` : rowData.profit
                  }}</span>
                  <span v-else>{{ rowData.profit }}</span>
                </span>
              </template>
              <template v-else-if="column.dataKey === 'blanceType'">
                <span>{{
                  rowData.profit > 0
                    ? $t("table.deposit")
                    : $t("table.withdrawal")
                }}</span>
              </template>
              <template v-else-if="column.dataKey === 'storage'">
                <span :class="[getCellClass(+rowData.storage)]">{{
                  rowData.storage
                }}</span>
              </template>
              <template v-else-if="column.dataKey === 'fee'">
                <span :class="[getCellClass(+rowData.fee)]">{{
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
                <el-tooltip :content="t('table.closePosition')" placement="top">
                  <el-icon
                    class="iconfont"
                    @click="closeMarketOrder(rowData)"
                    v-if="!marketCloseLodingMap[rowData.id]"
                  >
                    <CloseBold />
                  </el-icon>
                  <el-icon
                    v-if="marketCloseLodingMap[rowData.id]"
                    class="loading"
                    ><Loading
                  /></el-icon>
                </el-tooltip>
              </template>
              <template v-else-if="column.dataKey === 'orderAction'">
                <el-tooltip :content="t('table.cancelOrder')" placement="top">
                  <el-icon
                    class="iconfont"
                    @click="delPendingOrder(rowData)"
                    v-if="!pendingCloseLodingMap[rowData.id]"
                  >
                    <CloseBold />
                  </el-icon>
                  <el-icon
                    v-if="pendingCloseLodingMap[rowData.id]"
                    class="loading"
                    ><Loading
                  /></el-icon>
                </el-tooltip>
              </template>
              <template v-else>
                {{
                  [null, undefined, ""].includes(rowData[column.dataKey])
                    ? "-"
                    : rowData[column.dataKey] || "-"
                }}
              </template>
            </template>
            <template #footer>
              <div class="loadingFooter" v-if="pageLoading">
                <el-icon class="loading"><Loading /></el-icon>
              </div>
              <div
                class="blaRecFooter"
                v-if="!pageLoading && activeKey === 'blanceRecord'"
              >
                <span class="blaRecFooter_item">
                  <el-text type="info">{{ $t("table.netDeposit") }}：</el-text>
                  <el-text>{{ netDeposit }}</el-text>
                </span>
                <span class="blaRecFooter_item">
                  <el-text type="info"
                    >{{ $t("table.totalDeposit") }}（{{ accDeposit.len }}
                    {{ $t("table.transactions_deposit") }}）：</el-text
                  >
                  <el-text>{{ accDeposit.sum }}</el-text>
                </span>
                <span class="blaRecFooter_item">
                  <el-text type="info"
                    >{{ $t("table.totalWithdrawal") }}（{{ accWithdrawal.len }}
                    {{ $t("table.transactions_withdrawal") }}）：</el-text
                  >
                  <el-text>{{ accWithdrawal.sum }}</el-text>
                </span>
              </div>
              <div
                class="MOHFooter"
                :style="{ width: MOHFWidth }"
                v-if="
                  !pageLoading &&
                  activeKey === 'marketOrderHistory' &&
                  dataSource.length
                "
              >
                <el-text type="info">{{ $t("table.Total") }}：</el-text>
                <span :class="[getCellClass(+MOHProSum)]">
                  {{ MOHProSum }}</span
                >
              </div>
            </template>
            <template #empty>
              <el-empty :image-size="80">
                <template #image>
                  <BaseImg iconName="icon_empty"></BaseImg>
                </template>
              </el-empty>
            </template>
          </el-table-v2>
        </template>
      </el-auto-resizer>
    </div>
    <MarketOrderEdit
      v-model:visible="state.marketDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="quote"
    >
    </MarketOrderEdit>

    <PendingOrderEdit
      v-model:visible="state.pendingDialogVisible"
      :orderInfo="state.orderInfo"
      :quote="quote"
    >
    </PendingOrderEdit>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { cloneDeep, get, isNil, minBy } from "lodash";
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import * as orderTypes from "#/order";
import { CLOSE_TYPE } from "@/constants/common";
import * as orders from "api/order/index";
import { ifNumber } from "utils/common/index";
import { getOrderType, getTradingDirection } from "utils/order/index";
import { tableColumns } from "./config";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useTime } from "@/store/modules/time";

import SelectSuffixIcon from "@/components/SelectSuffixIcon.vue";
import MarketOrderEdit from "../orderDialog/MarketOrderEdit.vue";
import PendingOrderEdit from "../orderDialog/PendingOrderEdit.vue";
import TimeSelect from "./components/TimeSelect.vue";

const { t } = useI18n();

const orderStore = useOrder();
const dialogStore = useDialog();
const timeStore = useTime();
const quotesStore = useQuotes();

const state = reactive({
  menu: [
    { label: t("table.marketOrder"), key: "marketOrder" },
    { label: t("table.pendingOrder"), key: "pendingOrder" },
    { label: t("table.marketOrderHistory"), key: "marketOrderHistory" },
    { label: t("table.pendingOrderHistory"), key: "pendingOrderHistory" },
    { label: t("table.blanceRecord"), key: "blanceRecord" },
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

const getCellClass = (num: number | string) => {
  if (typeof num === "string") {
    if (!ifNumber(num)) {
      return "";
    }
  }
  if (+num === 0) {
    return "";
  }
  return +num > 0 ? "buyWord" : "sellWord";
};

// 筛选过滤
const dataSource = computed(() => {
  const active = activeKey.value;
  const originData = cloneDeep(orderStore.orderData[active]);
  const symbols = orderStore.dataFilter[active].symbol || [];
  const direction = orderStore.dataFilter[active].direction;
  const pol = orderStore.dataFilter[active].pol;
  let result: orders.resOrders[] = [];
  if (originData) {
    result = originData.filter((item) => {
      let symbolResult = true;
      let directionResult = true;
      let polResult = true;
      if (symbols.length) {
        symbolResult = symbols.includes(item.symbol);
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
    const currentQuote = quotesStore.qoutes[e.symbol];
    const direction = getTradingDirection(e.type);
    let result: number;
    if (activeKey.value === "marketOrder") {
      result = direction === "buy" ? currentQuote.bid : currentQuote.ask;
    } else if (activeKey.value === "pendingOrder") {
      result = direction === "buy" ? currentQuote.ask : currentQuote.bid;
    } else {
      result = direction === "buy" ? currentQuote.ask : currentQuote.bid;
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
const getMarketOrderProfit = (rowData: orders.resOrders) => {
  const { volume, symbol, open_price, type, fee, storage } = rowData;
  const currentQuote = quotesStore.qoutes[symbol];
  const closePrice = type ? get(currentQuote, "bid") : get(currentQuote, "ask");
  if (!isNil(closePrice)) {
    const direction = getTradingDirection(type);
    const params = {
      symbol,
      closePrice: +closePrice,
      buildPrice: +open_price,
      volume: volume / 100,
      fee: +fee,
      storage: +storage,
    };
    const result = orderStore.getProfit(params, direction);
    const target = orderStore.orderData.marketOrder.find(
      (e: orders.resOrders) => e.id === rowData.id
    );
    if (target) {
      target.profit = +result;
    }
    return result;
  }
  return "-";
};

// 交易历史盈亏合计位置
import { watch } from "vue";
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
const marketCloseLodingMap = ref<Record<number, boolean>>({});
const closeMarketOrder = async (record: orders.resOrders) => {
  async function foo() {
    try {
      marketCloseLodingMap.value[record.id] = true;
      const res = await orders.marketOrdersClose({
        symbol: record.symbol,
        id: record.id,
        volume: record.volume,
      });
      marketCloseLodingMap.value[record.id] = false;
      if (res.data.action_success) {
        ElMessage.success(t("order.positionClosedSuccessfully"));
        orderStore.getData("order_closed");
      }
    } catch (error) {
      marketCloseLodingMap.value[record.id] = false;
    }
  }

  const ifOne = orderStore.getOneTrans();
  if (orderStore.ifOne) {
    foo();
    return;
  }
  if (ifOne === null) {
    dialogStore.openDialog("disclaimersVisible");
    return;
  }
  ElMessageBox.confirm("", t("order.confirmPositionClosure")).then(() => foo());
};

const closeMarketOrders = (command: number) => {
  ElMessageBox.confirm(t("order.confirmPositionClosure")).then(async () => {
    await orders.marketOrdersCloseMulti({ multi_type: command });
    ElMessage.success(t("order.positionClosedSuccessfully"));
  });
};

// 批量撤单
const closePendingOrders = (data: orders.resOrders[]) => {
  if (data.length === 0) {
    return;
  }
  ElMessageBox.confirm(
    t("tip.confirmDelPendingOrders", { num: data.length }),
    t("order.pendingOrderClosed")
  ).then(async () => {
    const list = data.map((item) => {
      return orders.delPendingOrders({
        symbol: item.symbol,
        id: item.id,
      });
    });
    const res = await Promise.all(list);
    if (res[0].data.action_success) {
      ElMessage.success(t("order.pendingOrderClosedSuccessfully"));
      orderStore.getData("order_closed");
      orderStore.getData("pending_order_deleted");
    }
  });
};

// 删除单个挂单
const pendingCloseLodingMap = ref<Record<number, boolean>>({});
const delPendingOrder = async (record: orders.resOrders) => {
  async function foo() {
    try {
      pendingCloseLodingMap.value[record.id] = true;
      const res = await orders.delPendingOrders({
        id: record.id,
        symbol: record.symbol,
      });
      pendingCloseLodingMap.value[record.id] = false;

      if (res.data.action_success) {
        ElMessage.success(t("order.pendingOrderClosedSuccessfully"));
        orderStore.getData("pending_order_deleted");
        return;
      }
      ElMessage.error(res.data.err_text);
    } catch (error) {
      pendingCloseLodingMap.value[record.id] = false;
    }
  }

  const ifOne = orderStore.getOneTrans();
  if (ifOne === null) {
    dialogStore.openDialog("disclaimersVisible");
  }

  if (!orderStore.ifOne) {
    ElMessageBox.confirm("", t("order.confirmPendingClosure")).then(() =>
      foo()
    );
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
        dialogStore.incrementZIndex();
        state.marketDialogVisible = true;
      }
      if (activeKey.value === "pendingOrder") {
        dialogStore.incrementZIndex();
        state.pendingDialogVisible = true;
      }
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

const quote = computed(() => {
  const quotes = quotesStore.qoutes;
  const symbol = state.orderInfo.symbol;
  return quotes[symbol] || {};
});

const getTableData = (type: string) => {
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
.loadingFooter {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
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
