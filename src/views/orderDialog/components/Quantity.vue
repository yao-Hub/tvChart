<template>
  <div class="Quantity">
    <span>数量</span>
    <div class="container">
      <a-tooltip :title="state.errorMessage" v-model:open="state.ifError">
        <a-auto-complete
          :class="[state.ifError ? 'complete' : '']"
          style="width: 100%;; margin-right: 5px;"
          v-model:value="state.num"
          :options="state.numDataSource"
        >
          <template #option="item">
            {{ item.value }} 手
          </template>
        </a-auto-complete>
      </a-tooltip>
      <span>手</span>
    </div>
    <span>{{ typeOption[props.type] }}保证金：~{{ Margin  }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, watch } from 'vue';
import { SessionSymbolInfo } from '#/chart/index';
import { getDecimalPlaces } from 'utils/common/index';

type SymbolStrings = Props['tradeAllowSymbols'][number]['symbol'];

interface Props {
  type: 'buy' | 'sell'
  tradeAllowSymbols: SessionSymbolInfo[]
  selectedSymbol: SymbolStrings
  openPrice: number
};

const typeOption = {
  buy: '买入',
  sell: '卖出',
};

const props = defineProps<Props>();

// 当前品种
const currentSymbol = computed(() => {
  return props.tradeAllowSymbols.find(e => e.symbol === props.selectedSymbol);
});

// 单笔最小手数
const minVolume = computed(() => {
  const symbol = currentSymbol.value;
  if (symbol) {
    const volume_min = (symbol.volume_min / 100).toString();
    return volume_min;
  }
  return '0';
});

// 单笔最大手数
const maxVolume = computed(() => {
  const symbol = currentSymbol.value;
  if (symbol) {
    const volume_max = (symbol.volume_max / 100).toString();
    return volume_max;
  }
  return '0';
});

// 保证金
const Margin = computed(() => {
  let result = 0;
  const symbol = currentSymbol.value;
  if (symbol) {
    const leverage = symbol.leverage;
    const margin = symbol.margin;
    if (leverage) {
      result = +props.openPrice * symbol.contract_size / leverage * +state.num;
    }
    result = margin * +state.num;
    return result.toFixed(symbol.digits);
  }
});

const emit = defineEmits(['quantity']);

const state = reactive({
  num: minVolume.value,
  numDataSource: [
    { value: '0.01'},
    { value: '0.05'},
  ],
  ifError: false,
  errorMessage: ''
});

// 数量自动填充列表
const setNumDataSource = () => {
  state.numDataSource = [
    { value: '0.01'},
    { value: '0.05'},
  ];
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: (0.1 * i).toFixed(1).toString() });
  }
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: i.toString() });
  }
  for (let i = 1; i <= 5; i++) {
    state.numDataSource.push({ value: (10 * i).toString() });
  }
  state.numDataSource.push({ value: '100'})
};
setNumDataSource();

onMounted(() => {
  emit('quantity', state.num);
});
// state.num
watch(() => [state.num, currentSymbol.value], () => {
  const num = state.num;
  if (+num < +minVolume.value) {
    state.num = minVolume.value;
  }
  if (+num > +maxVolume.value) {
    state.num = maxVolume.value;
  }
  // 必须为volume_step的倍数
  if (currentSymbol.value && currentSymbol.value.volume_step > 0) {
    const step = currentSymbol.value.volume_step;
    const places = getDecimalPlaces(+state.num);
    const num = places > 0 ? +state.num * Math.pow(10, places) : +state.num;
    if (num % step !== 0) {
      state.ifError = true;
      state.errorMessage = `需为${step}的倍数`;
    }
  }
  state.ifError = false;
  emit('quantity', state.num);
}, { immediate: true });

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
    .complete::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: #9f4747;
      z-index: 1;
      border-radius: 5px;
      opacity: 0.6;
    }
  }
}
</style>