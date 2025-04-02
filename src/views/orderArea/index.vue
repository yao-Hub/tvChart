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
            <el-text type="info">{{ t("feedback") }}</el-text>
          </div>
        </div>
      </div>
    </HorizontalScrolling>
    <div class="container" ref="container">
      <HorizontalScrolling style="margin-bottom: 8px">
        <div class="filter">
          <SymbolSelect
            v-if="!['blanceRecord', 'log'].includes(activeKey)"
            style="width: 200px; flex-shrink: 0; height: 32px"
            v-model="orderStore.state.dataFilter[activeKey].symbol"
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
            v-model="orderStore.state.dataFilter[activeKey].direction"
            clearable
            :placeholder="t('table.direction')"
          >
            <el-option value="buy" :label="t('order.buy')"></el-option>
            <el-option value="sell" :label="t('order.sell')"></el-option>
          </el-select>
          <el-select
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'marketOrder'"
            v-model="orderStore.state.dataFilter[activeKey].pol"
            clearable
            :placeholder="t('table.profit')"
          >
            <el-option value="profit" :label="t('order.profit')"></el-option>
            <el-option value="loss" :label="t('order.loss')"></el-option>
          </el-select>
          <TimeRange
            v-if="activeKey === 'pendingOrderHistory'"
            v-model:value="orderStore.state.dataFilter[activeKey].createTime"
            style="min-width: 380px"
            :pickerOption="{
              startPlaceholder: t('table.createStartTime'),
              endPlaceholder: t('table.createEndTime'),
            }"
            @timeChange="getTableData('pendingOrderHistory')"
            >{{ t("table.createTime") }}：</TimeRange
          >
          <TimeRange
            v-if="['marketOrderHistory'].includes(activeKey)"
            style="min-width: 380px"
            v-model:value="orderStore.state.dataFilter[activeKey].addTime"
            :pickerOption="{
              startPlaceholder: t('table.positionOpeningStartTime'),
              endPlaceholder: t('table.positionOpeningEndTime'),
            }"
            @timeChange="getTableData('marketOrderHistory')"
            >{{ t("table.positionOpeningTime") }}：</TimeRange
          >
          <TimeRange
            v-if="['marketOrderHistory'].includes(activeKey)"
            style="min-width: 380px"
            v-model:value="orderStore.state.dataFilter[activeKey].closeTime"
            :pickerOption="{
              startPlaceholder: t('table.positionClosingStartTime'),
              endPlaceholder: t('table.positionClosingEndTime'),
            }"
            @timeChange="getTableData('marketOrderHistory')"
            >{{ t("table.positionClosingTime") }}：</TimeRange
          >
          <el-select
            :suffix-icon="SelectSuffixIcon"
            style="width: 130px"
            v-if="activeKey === 'blanceRecord'"
            v-model="orderStore.state.dataFilter[activeKey].pol"
            clearable
            :placeholder="t('table.blanceType')"
          >
            <el-option value="profit" :label="t('table.deposit')"></el-option>
            <el-option value="loss" :label="t('table.withdrawal')"></el-option>
          </el-select>
          <TimeRange
            v-if="['blanceRecord'].includes(activeKey)"
            style="min-width: 380px"
            v-model:value="orderStore.state.dataFilter[activeKey].createTime"
            :pickerOption="{
              startPlaceholder: t('table.startTime'),
              endPlaceholder: t('table.endTime'),
            }"
            @timeChange="getTableData('blanceRecord')"
            >{{ t("table.time") }}：</TimeRange
          >
          <DataPicker
            v-if="activeKey === 'log'"
            v-model:value="orderStore.state.dataFilter.log.day"
            @timeChange="getTableData('log')"
          >
            <span>{{ t("table.date") }}：</span>
          </DataPicker>
          <el-select
            v-if="activeKey === 'log'"
            v-model="orderStore.state.dataFilter.log.logType"
            clearable
            :placeholder="t('table.logType')"
            @change="getTableData('log')"
            style="width: 200px"
          >
            <el-option value="error" label="Error"></el-option>
            <el-option value="info" label="Info"></el-option>
          </el-select>
          <el-select
            v-if="activeKey === 'log'"
            v-model="orderStore.state.dataFilter.log.origin"
            clearable
            :placeholder="t('table.origin')"
            @change="getTableData('log')"
            style="width: 230px"
          >
            <el-option value="network" label="Network"></el-option>
            <el-option value="trades" label="Trades"></el-option>
            <el-option value="audit" label="Audit"></el-option>
            <!-- <el-option value="history" label="History"></el-option>
            <el-option value="security" label="Security"></el-option>
            <el-option value="application" label="Application"></el-option> -->
          </el-select>

          <div class="rightOpera">
            <el-dropdown
              trigger="click"
              v-if="['marketOrder'].includes(activeKey)"
              @command="closeMarketOrders"
            >
              <el-button type="primary">
                <span class="label">{{ t("table.batchClose") }}</span>
                <BaseImg class="caretDownIcon" iconName="caretDown" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">{{
                    t("table.allPositionsClose")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="2">{{
                    t("table.closeAllLongPositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="3">{{
                    t("table.closeAllShortPositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="4">{{
                    t("table.closeProfitablePositions")
                  }}</el-dropdown-item>
                  <el-dropdown-item :command="5">{{
                    t("table.closeLosingPositions")
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="primary"
              v-show="activeKey === 'pendingOrder'"
              @click="
                closePendingOrders(orderStore.state.orderData.pendingOrder)
              "
              >{{ t("table.cancelAllOrders") }}</el-button
            >
            <Deposit
              v-show="
                activeKey === 'blanceRecord' &&
                useNetwork().currentLine?.isOfficial === '1'
              "
            ></Deposit>
          </div>
        </div>
      </HorizontalScrolling>

      <el-auto-resizer style="height: calc(100% - var(--base-height))">
        <template #default="{ height, width }">
          <el-table-v2
            :key="activeKey"
            v-loading="orderStore.state.dataLoading[activeKey]"
            :columns="state.columns[activeKey]"
            :data="dataSource"
            :row-height="32"
            :header-height="32"
            :cell-props="{
              style: { padding: '0 16px' },
            }"
            :width="Math.floor(width)"
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
            <template #header-cell="{ column, columnIndex }">
              <div
                :class="{ 'header-box': !!column.title }"
                @mouseenter="headerMouseenter(columnIndex)"
                @mouseleave="headerMouseLeave"
              >
                <div>{{ column.title || "" }}</div>
                <div
                  class="drag-line"
                  v-show="
                    columnIndex !== state.columns[activeKey].length - 1 &&
                    dragLineList.includes(columnIndex)
                  "
                  @mousedown="(e: MouseEvent) => mousedown(e, columnIndex)"
                >
                  |
                </div>
              </div>
            </template>
            <template #cell="{ column, rowData }">
              <template v-if="column.dataKey.includes('time')">{{
                formatTime(rowData[column.dataKey])
              }}</template>
              <template v-else-if="column.dataKey === 'dayId'">{{
                formatTime(rowData.id, "YYYY.MM.DD HH:mm:ss.SSS")
              }}</template>
              <template v-else-if="column.dataKey === 'volume'">{{
                rowData.volume / 100
              }}</template>
              <template v-else-if="column.dataKey === 'type'">
                <span>{{
                  t(`order.${getTradingDirection(rowData.type)}`)
                }}</span>
              </template>
              <template v-else-if="column.dataKey === 'orderType'">
                <span
                  :class="[(rowData.type & 1) === 0 ? 'buyWord' : 'sellWord']"
                  >{{ getOrderType(rowData.type) }}</span
                ></template
              >
              <template v-else-if="column.dataKey === 'open_price'">{{
                formatPrice(rowData.open_price, rowData.digits)
              }}</template>
              <template v-else-if="column.dataKey === 'now_price'">{{
                getNowPrice(rowData)
              }}</template>
              <template v-else-if="column.dataKey === 'order_price'">{{
                getOrderPrice(rowData)
              }}</template>
              <template
                v-else-if="['tp_price', 'sl_price'].includes(column.dataKey)"
              >
                <div
                  class="operaCell"
                  :style="{
                    cursor: ['marketOrder', 'pendingOrder'].includes(activeKey)
                      ? 'pointer'
                      : 'default',
                  }"
                  @click="showOrderDialog(rowData)"
                >
                  {{ formatPrice(rowData[column.dataKey], rowData.digits) }}
                </div>
              </template>
              <template v-else-if="column.dataKey === 'profit'">
                <span :class="[getCellClass(rowData.profit), 'profitcell']">
                  <span v-if="activeKey === 'blanceRecord'">{{
                    +rowData.profit > 0 ? `+${rowData.profit}` : rowData.profit
                  }}</span>
                  <span v-else>{{
                    isNil(rowData.profit) ? "-" : rowData.profit
                  }}</span>
                </span>
              </template>
              <template v-else-if="column.dataKey === 'blanceType'">
                <span>{{
                  rowData.profit > 0
                    ? t("table.deposit")
                    : t("table.withdrawal")
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
                <el-icon
                  class="iconfont"
                  @click="closeMarketOrder(rowData)"
                  v-if="!marketCloseLodingMap[rowData.id]"
                  :title="t('table.closePosition')"
                >
                  <CloseBold />
                </el-icon>
                <el-icon v-if="marketCloseLodingMap[rowData.id]" class="loading"
                  ><Loading
                /></el-icon>
              </template>
              <template v-else-if="column.dataKey === 'orderAction'">
                <el-icon
                  class="iconfont"
                  @click="delOrder(rowData)"
                  v-if="!pendingCloseLodingMap[rowData.id]"
                  :title="t('table.cancelOrder')"
                >
                  <CloseBold />
                </el-icon>
                <el-icon
                  v-if="pendingCloseLodingMap[rowData.id]"
                  class="loading"
                  ><Loading
                /></el-icon>
              </template>
              <template v-else-if="column.dataKey === 'Placeholder'">
                <span></span>
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
                  <el-text type="info">{{ t("table.netDeposit") }}：</el-text>
                  <el-text>{{ netDeposit }}</el-text>
                </span>
                <span class="blaRecFooter_item">
                  <el-text type="info"
                    >{{ t("table.totalDeposit") }}（{{ accDeposit.len }}
                    {{ t("table.transactions_deposit") }}）：</el-text
                  >
                  <el-text>{{ accDeposit.sum }}</el-text>
                </span>
                <span class="blaRecFooter_item">
                  <el-text type="info"
                    >{{ t("table.totalWithdrawal") }}（{{ accWithdrawal.len }}
                    {{ t("table.transactions_withdrawal") }}）：</el-text
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
                <el-text type="info">{{ t("table.Total") }}：</el-text>
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
    >
    </MarketOrderEdit>

    <PendingOrderEdit
      v-model:visible="state.pendingDialogVisible"
      :orderInfo="state.orderInfo"
    >
    </PendingOrderEdit>
  </div>
</template>

<script setup lang="ts">
import Decimal from "decimal.js";
import { ElMessage, ElMessageBox } from "element-plus";
import { cloneDeep, debounce, get, isNil, minBy } from "lodash";
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";

import * as orderTypes from "#/order";
import { CLOSE_TYPE } from "@/constants/common";
import * as orders from "api/order/index";
import { ifNumber } from "utils/common/index";
import { getOrderType, getTradingDirection } from "utils/order/index";
import { tableColumns } from "./config";
import { logIndexedDB } from "utils/IndexedDB/logDatabase";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { useQuotes } from "@/store/modules/quotes";
import { useStorage } from "@/store/modules/storage";
import { useTime } from "@/store/modules/time";
import { useUser } from "@/store/modules/user";

import SelectSuffixIcon from "@/components/SelectSuffixIcon.vue";
import MarketOrderEdit from "../orderDialog/MarketOrderEdit.vue";
import PendingOrderEdit from "../orderDialog/PendingOrderEdit.vue";
import DataPicker from "./components/DataPicker.vue";
import TimeRange from "./components/TimeRange.vue";
import Deposit from "./components/Deposit.vue";

const { t } = useI18n();

const orderStore = useOrder();
const dialogStore = useDialog();
const timeStore = useTime();
const quotesStore = useQuotes();
const storageStore = useStorage();

const MIN_COLUMN_WIDTH = 80;

// 初始化列宽  有缓存
const storageColumns = storageStore.getItem("tableColumns");
if (storageColumns) {
  for (const i in storageColumns) {
    const tabKey = i as orderTypes.TableTabKey;
    const options = storageColumns[tabKey];
    for (const op in options) {
      const target = tableColumns[tabKey].find((e) => e.dataKey === op);
      if (target) {
        target.width = options[op];
      }
    }
  }
}

const state = reactive({
  menu: [
    { label: t("table.marketOrder"), key: "marketOrder" },
    { label: t("table.pendingOrder"), key: "pendingOrder" },
    { label: t("table.marketOrderHistory"), key: "marketOrderHistory" },
    { label: t("table.pendingOrderHistory"), key: "pendingOrderHistory" },
    { label: t("table.blanceRecord"), key: "blanceRecord" },
    { label: t("table.log"), key: "log" },
  ],
  columns: cloneDeep(tableColumns),
  marketDialogVisible: false,
  pendingDialogVisible: false,
  orderInfo: {} as orders.resOrders & orders.resPendingOrders,
});

const activeKey = ref<orderTypes.TableTabKey>("marketOrder");

// 表格宽高的系列操作
const container = ref();
let observer: ResizeObserver | null = null;
onMounted(() => {
  adjustTable();
  // 拖拽时改变table的高
  observer = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      adjustTable();
    });
  });
  observer.observe(container.value);
});

const ifRequest = reactive<{
  [key in orderTypes.TableTabKey]?: boolean;
}>({});
// 动态调整表格的列宽
watch(
  () => activeKey.value,
  () => {
    adjustTable();
    if (ifRequest[activeKey.value]) {
      return;
    }
    try {
      orderStore.getData(activeKey.value);
      ifRequest[activeKey.value] = true;
    } catch (error) {}
  }
);
const adjustTable = debounce(() => {
  const epsilon = 3;
  const columns_widths = state.columns[activeKey.value].reduce(
    (pre, next) => pre + next.width,
    0
  );
  if (container.value) {
    // - margin padding border
    const container_width = container.value.offsetWidth - 32;

    // 使用一个误差范围来比较浮点数
    if (Math.abs(columns_widths - container_width) > epsilon) {
      const container_width_dec = new Decimal(container_width);
      const columns_widths_dec = new Decimal(columns_widths);
      state.columns[activeKey.value].forEach((item) => {
        const minw = item.minWidth || MIN_COLUMN_WIDTH;
        let width = new Decimal(item.width);
        if (columns_widths > container_width && item.minWidth) {
          width = new Decimal(item.minWidth);
        }
        // width / columns_widths_dec * container_width_dec
        const result = width
          .div(columns_widths_dec)
          .mul(container_width_dec)
          .toString();
        const floorRes = Math.floor(+result);
        item.width = floorRes < minw ? minw : floorRes;
      });
    }
  }
});

// 列分割线改变列宽逻辑
const dragLineList = ref<number[]>([]);
const columnRefresh = (x: number, index: number) => {
  if (index < 0) {
    return;
  }
  const nowCol = state.columns[activeKey.value][index];
  const nextCol = state.columns[activeKey.value][index + 1];

  // 上一个单元格移动
  const minNowW = nowCol.minWidth || MIN_COLUMN_WIDTH;
  // 向左
  if (x < 0 && nowCol.width <= minNowW) {
    return;
  }
  const nowW = nowCol.width + x;

  // 下一个单元格移动
  const minNextW = nextCol.minWidth || MIN_COLUMN_WIDTH;
  // 向右
  if (x > 0 && nextCol.width <= minNextW) {
    return;
  }
  const nextW = nextCol.width - x;

  const allWidth = nowCol.width + nextCol.width;
  if (nowW + nextW > allWidth + 1) {
    return;
  }
  nowCol.width = nowW;
  storageStore.saveOrderTableColumn(activeKey.value, nowCol.dataKey, nowW);

  nextCol.width = nextW;
  storageStore.saveOrderTableColumn(activeKey.value, nextCol.dataKey, nextW);
};
let isResizing = false;
let isEnter = false;
let lastX = 0;
let currentIndex = -1;
const mousedown = (e: MouseEvent, index: number) => {
  isResizing = true;
  lastX = e.clientX;
  currentIndex = index;
};
const mouseMove = (e: MouseEvent) => {
  if (isResizing) {
    const offsetX = e.clientX - lastX;
    columnRefresh(offsetX, currentIndex);
    lastX = e.clientX;
  }
};
const mouseUp = () => {
  isResizing = false;
  if (!isEnter) {
    dragLineList.value = [];
  }
};
document.addEventListener("mousemove", mouseMove);
document.addEventListener("mouseup", mouseUp);
const headerMouseenter = (index: number) => {
  isEnter = true;
  if (isResizing) {
    return;
  }
  dragLineList.value.push(index);
  if (index !== 0) {
    dragLineList.value.push(index - 1);
  }
};
const headerMouseLeave = () => {
  isEnter = false;
  if (isResizing) {
    return;
  }
  dragLineList.value = [];
};

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
  document.removeEventListener("mousemove", mouseMove);
  document.removeEventListener("mouseup", mouseUp);
});

const getTableHeight = (height: number) => {
  return ["marketOrderHistory"].includes(activeKey.value)
    ? Math.min((dataSource.value.length + 2) * 32, height)
    : height;
};

const formatPrice = (price: number, digits: number) => {
  return price ? price.toFixed(digits) : "-";
};

// 出入金记录底部合计
import { accAdd } from "utils/arithmetic";
const profits = computed(() => {
  return (orderStore.state.orderData.blanceRecord || []).map(
    (item) => item.profit
  );
});
// 净入金：
const netDeposit = computed(() => {
  return profits.value.reduce((pre, next) => {
    return accAdd(+pre, +next);
  }, 0);
});
// 累计入金：
const accDeposit = computed(() => {
  const list = profits.value.filter((item) => +item > 0);
  const sum = list.reduce((pre, next) => {
    return accAdd(+pre, +next);
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
    return accAdd(+pre, +next);
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
  if (active === "log") {
    return orderStore.state.orderData.log;
  }
  const originData = cloneDeep(orderStore.state.orderData[active]);
  const symbols = orderStore.state.dataFilter[active].symbol || [];
  const direction = orderStore.state.dataFilter[active].direction;
  const pol = orderStore.state.dataFilter[active].pol;
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
        polResult = +item.profit > 0;
      }
      if (pol && pol === "loss") {
        polResult = +item.profit < 0;
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
const formatTime = (timestamp: string, format = "YYYY.MM.DD HH:mm:ss") => {
  const timezone = timeStore.settedTimezone;
  const result = dayjs.tz(timestamp, timezone).format(format);
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

// 交易历史盈亏合计位置
import { watch } from "vue";
import { useNetwork } from "@/store/modules/network";
const MOHFWidth = ref("");
const tableXScroll = ref(0);
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

// 交易历史盈亏合计
const MOHProSum = computed(() => {
  const data = dataSource.value as orders.resOrders[];
  const sum = data.reduce((pre, next) => {
    return pre + +next.profit;
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
  return t("table.days", { num: daysDifference || 1 });
};

// 市价单 单个平仓
const marketCloseLodingMap = ref<Record<number, boolean>>({});
const closeMarketOrder = debounce(
  async (record: orders.resOrders & orders.resPendingOrders) => {
    if (orderStore.state.ifOne) {
      marketCloseLodingMap.value[record.id] = true;
      orderStore
        .delMarketOrder({ ...record, volume: record.volume / 100 })
        .then(() => {
          const index = orderStore.state.orderData.marketOrder.findIndex(
            (e) => e.id === record.id
          );
          orderStore.state.orderData.marketOrder.splice(index, 1);
        })
        .finally(() => (marketCloseLodingMap.value[record.id] = false));
      return;
    }
    if (orderStore.state.ifOne === null) {
      dialogStore.openDialog("disclaimersVisible");
      return;
    }
    state.orderInfo = record;
    dialogStore.incrementZIndex();
    state.marketDialogVisible = true;
  },
  200,
  { leading: true }
);

// 全部关闭市价单
const closeMarketOrders = (command: number) => {
  ElMessageBox.confirm(t("order.confirmPositionClosure")).then(async () => {
    let errmsg = "";
    let logStr = "";
    const typeList = [
      "",
      "allPositionsClose",
      "closeAllLongPositions",
      "closeAllShortPositions",
      "closeProfitablePositions",
      "closeLosingPositions",
    ];
    try {
      const res = await orders.marketOrdersCloseMulti({ multi_type: command });
      orderStore.getData("order_closed");
      logStr = res.data.closed_ids.map((id) => `#${id}`).join(",");
      ElMessage.success(t("order.positionClosedSuccessfully"));
    } catch (error) {
      errmsg =
        get(error, "errmsg") || get(error, "message") || JSON.stringify(error);
    } finally {
      const logData = {
        logType: errmsg ? "error" : "info",
        origin: "trades",
        logName: "close market orders",
        detail: `${useUser().account.login}: close market orders ${
          typeList[command]
        } ${errmsg ? `error ${errmsg}` : ""} ${logStr}`,
        login: useUser().account.login,
        time: dayjs().format("HH:mm:ss.SSS"),
        id: new Date().getTime(),
        day: dayjs().format("YYYY.MM.DD"),
      };
      await logIndexedDB.addData(logData);
      useOrder().getData("log");
    }
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
  ).then(() => {
    const list = data.map((item) => {
      return orderStore.delPendingOrder(item);
    });
    Promise.all(list);
  });
};

// 删除单个挂单
const pendingCloseLodingMap = ref<Record<number, boolean>>({});
const delOrder = debounce(
  (record: orders.resOrders) => {
    pendingCloseLodingMap.value[record.id] = true;
    orderStore.delPendingOrder(record).finally(() => {
      pendingCloseLodingMap.value[record.id] = false;
    });
  },
  200,
  { leading: true }
);

const showOrderDialog = (rowData: any) => {
  state.orderInfo = rowData;
  if (activeKey.value === "marketOrder") {
    dialogStore.incrementZIndex();
    state.marketDialogVisible = true;
  }
  if (activeKey.value === "pendingOrder") {
    dialogStore.incrementZIndex();
    state.pendingDialogVisible = true;
  }
};

// 双击行
const rowProps = ({ rowData }: any) => {
  return {
    ondblclick: () => {
      showOrderDialog(rowData);
    },
  };
};

// 到底触发(持仓历史，挂单历史，出入金分页)
const pageLoading = ref(false);
const endReached = async () => {
  const nowData = orderStore.state.orderData[
    activeKey.value
  ] as orders.resOrders[];
  const minId = minBy(nowData, "id")?.id;
  if (
    !minId ||
    orderStore.state.dataEnding[activeKey.value] ||
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
    case "log":
      orderStore.getLog();
      break;
    default:
      break;
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.baseTabs .baseTabs_item:nth-of-type(1) {
  border-radius: 0 4px 0 0;
}
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
    height: var(--component-size);
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
    height: calc(100% - var(--component-size) - 4px);
    padding: 8px;
    border: 4px solid;
    border-bottom: none;
    border-radius: 4px;
    margin: 0 4px;
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
.operaCell {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
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
