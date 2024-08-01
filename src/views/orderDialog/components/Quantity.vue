<template>
  <div class="Quantity">
    <span>数量</span>
    <div class="container">
      <a-auto-complete
        style="flex: 5.5"
        v-model:value="state.num"
        :options="state.numDataSource"
      >
        <template #option="item"> {{ item.value }} 手 </template>
      </a-auto-complete>
      <div class="step">
        <CaretUpFilled @click="addNum" />
        <CaretDownFilled @click="reduceNum" />
      </div>
      <span>手</span>
    </div>
    <span>{{ typeOption[props.type] }}保证金：~{{ Margin }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { SessionSymbolInfo } from "#/chart/index";
import { round } from "utils/common/index";
import { CaretUpFilled, CaretDownFilled } from "@ant-design/icons-vue";

interface Props {
  type: "buy" | "sell";
  openPrice: number;
  currentSymbolInfo?: SessionSymbolInfo;
}

const typeOption = {
  buy: "买入",
  sell: "卖出",
};

const props = defineProps<Props>();

// 单笔最小手数
const minVolume = computed(() => {
  const symbol = props.currentSymbolInfo;
  if (symbol) {
    const volume_min = (symbol.volume_min / 100).toString();
    return volume_min;
  }
  return "0";
});

// 单笔最大手数
const maxVolume = computed(() => {
  const symbol = props.currentSymbolInfo;
  if (symbol) {
    const volume_max = (symbol.volume_max / 100).toString();
    return volume_max;
  }
  return "0";
});

// 保证金
const Margin = computed(() => {
  let result = 0;
  const symbol = props.currentSymbolInfo;
  if (symbol) {
    const leverage = symbol.leverage;
    const margin = symbol.margin;
    if (leverage) {
      result =
        ((+props.openPrice * symbol.contract_size) / leverage) * +state.num;
    } else {
      result = margin * +state.num;
    }
    return round(result, 2);
  }
});

const emit = defineEmits(["quantity", "quantityFail"]);

const state = reactive({
  num: minVolume.value,
  numDataSource: [{ value: "0.01" }, { value: "0.05" }],
});

// 数量自动填充列表
const setNumDataSource = () => {
  state.numDataSource = [{ value: "0.01" }, { value: "0.05" }];
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: (0.1 * i).toFixed(1).toString() });
  }
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: i.toString() });
  }
  for (let i = 1; i <= 5; i++) {
    state.numDataSource.push({ value: (10 * i).toString() });
  }
  state.numDataSource.push({ value: "100" });
};
setNumDataSource();

watch(
  () => [state.num, props.currentSymbolInfo],
  () => {
    const num = state.num;
    if (+num < +minVolume.value) {
      state.num = minVolume.value;
    }
    if (+num > +maxVolume.value) {
      state.num = maxVolume.value;
    }
    emit("quantity", state.num);
  },
  { immediate: true }
);

const step = computed(() => {
  return props.currentSymbolInfo ? props.currentSymbolInfo.volume_step : 1;
});

const addNum = () => {
  state.num = String(round(+state.num + step.value, 2));
};
const reduceNum = () => {
  state.num = String(round(+state.num - step.value, 2));
};
</script>

<style lang="scss" scoped>
.Quantity {
  display: flex;
  width: 45%;
  flex-direction: column;
  .container {
    display: flex;
    flex: 1;
    align-items: center;
    .step {
      display: flex;
      flex: 1;
      flex-direction: column;
      align-items: center;
      background-color: #595959;
      margin-right: 5px;
      box-sizing: content-box;
      border-radius: 5px;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      & span {
        color: #7f7f7f;
      }
      & span:hover {
        color: #fff;
      }
    }
  }
}
</style>
