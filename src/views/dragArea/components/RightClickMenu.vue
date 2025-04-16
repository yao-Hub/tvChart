<template>
  <div
    class="rightClickMenu"
    v-show="model"
    :style="{ top: `${pos.top}px`, left: `${pos.left}px` }"
  >
    <div :class="{ item: true, pending: orderLoading }" @click="addOrder">
      <span>{{ t("order.new") }}</span>
      <el-icon class="loading" v-if="orderLoading"><Loading /></el-icon>
    </div>
    <div class="item" @click="addChart">{{ t("chart.new") }}</div>
    <div class="item" @click="showDetailDialog">{{ t("symbolInfo") }}</div>
    <div class="item" @click="toogleTopUp">
      {{ t(`${props.rowData.topSort ? "unTop" : "topUp"}`) }}
    </div>
    <div :class="{ item: true, pending: delLoading }" @click="handleCancelFav">
      <span>{{ t("delete") }}</span>
      <el-icon class="loading" v-if="delLoading"><Loading /></el-icon>
    </div>
  </div>

  <el-dialog
    v-if="dialogVisible"
    v-model="dialogVisible"
    width="900"
    :zIndex="dialogStore.zIndex"
    :footer="null"
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{ rowData.symbol }}</span>
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
    </template>
    <div v-loading="loading" v-if="!ifError" class="container">
      <div class="infoDetail">
        <el-text class="secondaryTitle">{{
          getValue("description" as keyof ISessionSymbolInfo)
        }}</el-text>
        <div class="infobox">
          <div v-for="item in infoList" class="item">
            <el-text type="info">{{ item.label }}</el-text>
            <el-text>{{ getValue(item.key) }}</el-text>
          </div>
        </div>
      </div>
      <div class="timeTable">
        <el-text class="secondaryTitle">{{ t("transactionTime") }}</el-text>
        <el-table
          :data="tableData"
          :cell-style="{ height: '42px', 'padding-left': '16px' }"
        >
          <el-table-column
            v-for="(item, index) in columns"
            :key="index"
            :prop="item.prop"
            :label="item.label"
          >
            <template #header="{ column }">
              <div class="weekday_header">
                <span>{{ column.label }}</span>
                <div class="line">|</div>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <el-empty v-else style="margin: auto" />
  </el-dialog>
</template>

<script setup lang="ts">
import { get } from "lodash";
import { ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { ISessionSymbolInfo } from "@/types/chart";
import { getSymbolDetail } from "api/symbols";
import { DataSource } from "../SymbolList.vue";

import { useChartInit } from "@/store/modules/chartInit";
import { useOrder } from "@/store/modules/order";
import { useSymbols } from "@/store/modules/symbols";
import { useUser } from "@/store/modules/user";

const { t } = useI18n();
const chartInitStore = useChartInit();
const orderStore = useOrder();
const symbolsStore = useSymbols();

const emit = defineEmits(["toogleTopUp", "cancelFav"]);

interface Props {
  pos: {
    top: number;
    left: number;
  };
  rowData: DataSource;
  variOrder: string | null;
}
const props = defineProps<Props>();
const model = defineModel<boolean>("visible", {
  required: true,
  default: false,
});
document.addEventListener("click", (event: MouseEvent) => {
  const menuDom = document.querySelector(".rightClickMenu");
  const target = event.target as Node;
  if (target && menuDom && menuDom.contains(target)) {
    return;
  }
  model.value = false;
});

type TOtherKey = "prepaidMode";
type Tkey = keyof ISessionSymbolInfo | TOtherKey;
interface Iitem {
  key: Tkey;
  label: string;
}
const settlementTypeMap: Record<number, string> = {
  1: "closed", // Market Closed
  2: "hours", // 24H
};
const infoList: Iitem[] = [
  { key: "symbol", label: t("symbolDetail.symbol") },
  { key: "path", label: t("symbolDetail.path") },
  { key: "digits", label: t("symbolDetail.digits") },
  { key: "contract_size", label: t("symbolDetail.contract_size") },
  { key: "leverage", label: t("symbolDetail.leverage") },
  { key: "prepaidMode", label: t("symbolDetail.prepaidMode") },
  { key: "margin", label: t("symbolDetail.margin") },
  { key: "volume_min", label: t("symbolDetail.volume_min") },
  { key: "volume_max", label: t("symbolDetail.volume_max") },
  { key: "volume_step", label: t("symbolDetail.volume_step") },
  { key: "stops_level", label: t("symbolDetail.stops_level") },
  { key: "buy_rate", label: t("symbolDetail.buy_rate") },
  { key: "sell_rate", label: t("symbolDetail.sell_rate") },
  { key: "settlement_type", label: t("symbolDetail.settlement_type") },
  { key: "fee", label: t("symbolDetail.fee") },
];

const orderLoading = ref(false);
const addOrder = async () => {
  try {
    const symbols = symbolsStore.symbolsTradeAllow.map((item) => item.symbol);
    if (symbols.indexOf(props.rowData.symbol) === -1) {
      ElMessage.warning(t("tip.symbolNoAllowTrading"));
      return;
    }
    await getDetail();
    if (symbolInfo.value && symbolInfo.value.current_trade_able) {
      orderStore.createOrder({ symbol: props.rowData.symbol });
      return;
    }
    ElMessage.warning(t("tip.marketClosed"));
  } finally {
    model.value = false;
  }
};
const addChart = () => {
  chartInitStore.addChart(props.rowData.symbol);
  model.value = false;
};

const symbolInfo = ref<ISessionSymbolInfo>();
const loading = ref(false);
const ifError = ref(false);
const getDetail = async () => {
  try {
    orderLoading.value = true;
    loading.value = true;
    const res = await getSymbolDetail({
      symbol: props.rowData.symbol,
      group: useUser().state.loginInfo!.group,
    });
    symbolInfo.value = res.data;
    ifError.value = false;
  } catch (error) {
    ifError.value = true;
  } finally {
    orderLoading.value = false;
    loading.value = false;
  }
};

import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
const dialogVisible = ref<boolean>(false);
const showDetailDialog = () => {
  dialogStore.incrementZIndex();
  dialogVisible.value = true;
  model.value = false;
  getDetail();
};

const toogleTopUp = () => {
  emit("toogleTopUp", props.rowData);
  model.value = false;
};

import { delOptionalQuery } from "api/symbols/index";
const delLoading = ref(false);
const handleCancelFav = async () => {
  try {
    delLoading.value = true;
    await delOptionalQuery({ symbols: [props.rowData.symbol] });
    const index = symbolsStore.mySymbols.findIndex(
      (e) => e.symbol === props.rowData.symbol
    );
    symbolsStore.mySymbols.splice(index, 1);
    emit("cancelFav");
  } finally {
    delLoading.value = false;
    model.value = false;
  }
};

const getValue = (key: Tkey) => {
  const info = symbolInfo.value;
  if (info) {
    const leverage = info.leverage;
    switch (key) {
      // 分类
      case "path":
        const pathList = info.path.split("/") || [];
        return pathList?.[0];
      case "prepaidMode":
        return leverage ? t("prepaidMode.dynamic") : t("prepaidMode.fixed");
      case "settlement_type":
        const settlementType = info.settlement_type;
        const type = settlementTypeMap[settlementType];
        return type ? t(`settlementType.${type}`) : "-";
      case "margin":
        return leverage ? "--" : info.margin;
      case "volume_max":
      case "volume_min":
      case "volume_step":
        const value = info[key];
        return value ? value / 100 : "--";
      default:
        return get(info, [key]) || "--";
    }
  }
  return "-";
};

import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
import { flattenDeep, groupBy, set, uniq } from "lodash";
import { ElMessage } from "element-plus";
const timeStore = useTime();
const tableData = ref<any[]>([{}, {}]);
const columns = ref<{ prop: string; label: string }[]>([]);
const formatTime = (time: number) => {
  const hours = Math.floor(time / 60);
  const second = time % 60;
  return `${hours < 9 ? "0" : ""}${hours}:${second < 9 ? "0" : ""}${second}`;
};
watchEffect(() => {
  const info = symbolInfo.value;
  const timezone = timeStore.settedTimezone;
  if (info) {
    tableData.value = [];
    const ttimes = info.ttimes;
    const timeList = flattenDeep(Object.values(ttimes));
    const weekDays = uniq(timeList.map((item) => item.week_day));
    columns.value = weekDays.map((item) => {
      return {
        label: dayjs().tz(timezone).day(item).format("dddd"),
        prop: String(item),
      };
    });
    const group = groupBy(timeList, "week_day");
    for (const i in group) {
      const [first, last] = group[i];
      if (first) {
        const { btime, etime } = first;
        const session = `${formatTime(btime)}-${formatTime(etime)}`;
        set(tableData.value, [0, String(i)], session);
      }
      if (last) {
        const { btime, etime } = last;
        const session = `${formatTime(btime)}-${formatTime(etime)}`;
        set(tableData.value, [1, String(i)], session);
      }
    }
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.rightClickMenu {
  position: fixed;
  z-index: 999;
  border-radius: 4px;
  @include box_shadow();
  overflow: hidden;
  display: flex;
  flex-direction: column;
  @include background_color("background-dialog");
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 10px 10px 10px 16px;
    width: 120px;
    height: var(--component-size);
    box-sizing: border-box;
    &:hover {
      @include background_color("background-hover");
    }
  }
  .pending {
    cursor: progress;
  }
}

.title {
  font-size: 18px;
}
.infoDetail {
  border-bottom: 1px solid;
  @include border_color("border");
  padding-bottom: 16px;
  margin-top: 24px;
}
.secondaryTitle {
  display: block;
  margin-bottom: 16px;
}
.infobox {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: repeat(auto-fill, 20px);
  grid-row-gap: 16px;
  .item {
    display: flex;
    span:first-child {
      min-width: 98px;
      padding-right: 8px;
      display: block;
    }
  }
}
.timeTable {
  margin: 24px 0;
}

:deep(.el-table__cell) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  padding: 0;
}
:deep(.el-table .cell) {
  padding: 0;
}
.weekday_header {
  position: relative;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  @include background_color("table-colored");
  height: 42px;
  width: 100%;
  padding-left: 16px;
  box-sizing: border-box;
  line-height: 42px;

  .line {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0 5px;
    box-sizing: border-box;
    @include font_color("border");
  }
}
</style>
