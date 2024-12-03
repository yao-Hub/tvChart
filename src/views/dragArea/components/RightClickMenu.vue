<template>
  <div
    class="rightClickMenu"
    v-show="model"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <div class="item" @click="addOrder">新订单</div>
    <div class="item" @click="addChart">新图表</div>
    <div class="item" @click="showDialog">品种信息</div>
  </div>

  <el-dialog
    v-model="dialogVisible"
    width="900"
    :before-close="handleClose"
    :footer="null"
  >
    <template #header>
      <span class="title">{{ props.symbol }}</span>
    </template>
    <div v-loading="loading" v-if="!ifError" class="container">
      <div class="infoDetail">
        <el-text class="secondaryTitle">{{
          getValue("description" as keyof ISymbolDetail)
        }}</el-text>
        <div class="infobox">
          <div v-for="item in infoList" class="item">
            <el-text type="info">{{ item.label }}</el-text>
            <el-text>{{ getValue(item.key) }}</el-text>
          </div>
        </div>
      </div>
      <div class="timeTable">
        <el-text class="secondaryTitle">交易时间</el-text>
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
                <div class="drag-line">|</div>
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
import { computed, ref, watchEffect } from "vue";

import { ISymbolDetail, symbolDetail } from "api/symbols";

import { useOrder } from "@/store/modules/order";
import { useChartInit } from "@/store/modules/chartInit";

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
type Tkey = keyof ISymbolDetail | TOtherKey;
interface Iitem {
  key: Tkey;
  label: string;
}
const settlementTypeMap: Record<number, string> = {
  1: "休市结算", // Market Closed
  2: "满24小时结算", // 24H
};
const infoList: Iitem[] = [
  { key: "symbol", label: "商品名称" },
  { key: "path", label: "商品分类" },
  { key: "digits", label: "小数位" },
  { key: "contract_size", label: "合约数量" },
  { key: "leverage", label: "杠杆" },
  { key: "prepaidMode", label: "预付款模式" },
  { key: "margin", label: "预付款" },
  { key: "volume_min", label: "最小交易量" },
  { key: "volume_max", label: "最大交易量" },
  { key: "volume_step", label: "交易量步长" },
  { key: "stops_level", label: "价格距离" },
  { key: "buy_rate", label: "买入库存费率" },
  { key: "sell_rate", label: "卖出库存费率" },
  { key: "settlement_type", label: "库存费结算模式" },
  { key: "fee", label: "手续费" },
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

const addOrder = () => {
  orderStore.currentSymbol = props.symbol;
  orderStore.createOrder();
  model.value = false;
};
const addChart = () => {
  chartInitStore.addChart(props.symbol);
  model.value = false;
};

const symbolInfo = ref<ISymbolDetail>();
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
const dialogVisible = ref<boolean>(false);
const showDialog = () => {
  dialogVisible.value = true;
  getDetail();
};
const handleClose = () => {
  dialogVisible.value = false;
};

const getValue = (key: Tkey) => {
  const info = symbolInfo.value;
  switch (key) {
    // 分类
    case "path":
      const pathList = info?.path.split("/") || [];
      return pathList?.[0];
    case "prepaidMode":
      const leverage = info?.leverage;
      return leverage ? "固定" : "动态";
    case "settlement_type":
      const type = info?.settlement_type;
      return type ? settlementTypeMap[type] || "-" : "-";
    default:
      return info ? info[key] : "-";
  }
};

import dayjs from "dayjs";
import { useTime } from "@/store/modules/time";
import { flattenDeep, groupBy, uniq, set } from "lodash";
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
  z-index: 2;
  border-radius: 4px;
  border: 1px solid #dee2e9;
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
    height: var(--size);
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
.weekday_header {
  position: relative;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  @include background_color("table-colored");
  height: 42px;
  width: 100%;
  padding-left: 16px;
  line-height: 42px;

  .drag-line {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0 5px;
    box-sizing: border-box;
    @include font_color("border");
  }
}
</style>
