<template>
  <div
    class="rightClickMenu"
    v-show="model"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <div class="item" @click="addOrder">{{ $t("order.new") }}</div>
    <div class="item" @click="addChart">{{ $t("chart.new") }}</div>
    <div class="item" @click="showDialog">{{ $t("symbolInfo") }}</div>
  </div>

  <el-dialog
    v-if="dialogVisible"
    v-model="dialogVisible"
    width="900"
    :zIndex="dialogStore.zIndex"
    :footer="null"
  >
    <template #header>
      <span class="title">{{ props.symbol }}</span>
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
        <el-text class="secondaryTitle">{{ $t("transactionTime") }}</el-text>
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
import { isNil } from "lodash";
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { ISessionSymbolInfo } from "@/types/chart/index";
import { symbolDetail } from "api/symbols";

import { useChartInit } from "@/store/modules/chartInit";
import { useOrder } from "@/store/modules/order";

const { t } = useI18n();
const chartInitStore = useChartInit();
const orderStore = useOrder();

interface Props {
  pos: {
    top: number;
    left: number;
  };
  symbol: string;
}
const props = defineProps<Props>();
const model = defineModel<boolean>("visible", {
  required: true,
  default: false,
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

const left = computed(() => {
  const iw = window.innerWidth;
  const symbolList = document.querySelector(".symbolList");
  if (symbolList) {
    const { left } = symbolList.getBoundingClientRect();
    // 判断是否超出了屏幕边界
    const peakRight = left + props.pos.left + 120;
    if (iw < peakRight) {
      return props.pos.left - 120;
    }
  }
  return props.pos.left;
});

const top = computed(() => {
  const ih = window.innerHeight;
  const symbolList = document.querySelector(".symbolList");
  if (symbolList) {
    const { top } = symbolList.getBoundingClientRect();
    const peakBottom = top + props.pos.top + 20 * 3;
    if (ih < peakBottom) {
      return props.pos.top - 20 * 3;
    }
  }
  return props.pos.top;
});

document.addEventListener("click", () => {
  model.value = false;
});

const addOrder = () => {
  orderStore.createOrder({ symbol: props.symbol });
};
const addChart = () => {
  chartInitStore.addChart(props.symbol);
};

const symbolInfo = ref<ISessionSymbolInfo>();
const loading = ref(false);
const ifError = ref(false);
const getDetail = async () => {
  try {
    loading.value = true;
    const res = await symbolDetail({ symbol: props.symbol });
    symbolInfo.value = res.data;
    loading.value = false;
    ifError.value = false;
  } catch (error) {
    loading.value = false;
    ifError.value = true;
  }
};

import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
const dialogVisible = ref<boolean>(false);
const showDialog = () => {
  dialogStore.incrementZIndex();
  dialogVisible.value = true;
  getDetail();
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
        return isNil(value) ? "-" : +value / 100;
      default:
        return info ? info[key] : "-";
    }
  }
  return "-";
};

import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
import { flattenDeep, groupBy, set, uniq } from "lodash";
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
  position: absolute;
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
    cursor: pointer;
    padding: 10px 0px 10px 16px;
    width: 120px;
    height: var(--component-size);
    box-sizing: border-box;
    &:hover {
      @include background_color("background-hover");
    }
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
