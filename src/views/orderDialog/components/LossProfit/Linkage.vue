<template>
  <div class="linkage">
    <div v-for="(value, key) in state.form" :key="key" class="item">
      <div class="linkageInput" :style="{backgroundColor: ifError(key, value) ? '#9f4747' : ''}">
        <a-input
          v-model:value="state.form[key]"
          :disabled="!props.disabled"
          @change="handleChange(key)">
          <template #prefix>
            <span v-show="state.focusKey !== key">~</span>
          </template>
          <template #addonAfter>
            <div class="afterBtns">
              <CaretUpFilled @click="addNum(key)" />
              <CaretDownFilled @click="reduceNum(key)" />
            </div>
          </template>
          <template #suffix v-if="key === 'balance'">
            <span>%</span>
          </template>
        </a-input>
      </div>
      <span v-if="props.showName" class="name">{{ $t(`order.${key}`) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed, watchEffect } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';
import { SessionSymbolInfo } from '#/chart/index';
import { useUser } from '@/store/modules/user';
import { getDecimalPlaces, round } from 'utils/common/index';

type SymbolStrings = Props['tradeAllowSymbols'][number]['symbol'];

interface Props {
  showName?: Boolean // 显示后缀的名字
  disabled: Boolean // 输入框disabled
  transactionType: string // 交易类型：买入卖出
  stopType: string // 止亏 or 止盈
  currentBuy: number // 当前买入价
  currentSell: number // 当前卖出价
  tradeAllowSymbols: SessionSymbolInfo[]
  selectedSymbol: SymbolStrings
  volume: number
}

const props = withDefaults(defineProps<Props>(), {
  showName: () => false,
  disabled: () => false,
});

const state = reactive({
  form: {
    point: '',
    price: '',
    balance: '',
    profit: ''
  } as Record<string, any>,
  pointCache: '',
  focusKey: 'point',
  calculateAction: {
    point: calculatePoint,
    price: calculatePrice,
    balance: calculateBalance,
    profit: calculateProfit
  }
});

// 当前品种
const currentSymbol = computed(() => {
  return props.tradeAllowSymbols.find(e => e.symbol === props.selectedSymbol);
});

// 止损止盈勾选toggle
watch(() => props.disabled, (newVal) => {
  if (!newVal) {
    for (const i in state.form) {
      state.form[i] = '';
    }
    return;
  }
  state.focusKey = 'point';
  state.form.point = state.pointCache || (props.stopType === 'stopLoss' ? '-100' : '100');
});

// 向上箭头点击
const addNum = (key: string) => {
  const currentNum = state.form[key] * 1;
  state.form[key] = `${currentNum + 1}`;
  state.focusKey = key;
};

// 向下箭头点击
const reduceNum = (key: string) => {
  const currentNum = state.form[key] * 1;
  state.form[key] = `${currentNum - 1}`;
  state.focusKey = key;
};

// 输入框变化
const handleChange = (key: string) => {
  state.focusKey = key;
};

// 输入校验
const ifError = (key: string, value: string) => {
  const stopType = props.stopType;
  // 止损
  if (stopType === 'stopLoss') {}
  // 止亏
  if (stopType === 'stopSurplus') {}
  return false;
};

// 止损止盈价抛出
const emit = defineEmits(['priceChange']);

watchEffect(() => {
  emit('priceChange', state.form.price);
}, { flush: 'sync' });

// 数据变化联动
watch(() => [state.form, props], () => {
  if (!props.disabled) {
    return;
  }
  state.pointCache = state.form.point;
  for (const i in state.form) {
    if (i !== state.focusKey) {
      state.form[i] = state.calculateAction[i as keyof typeof state.calculateAction]();
    }
  }
}, {
  immediate: true, deep: true
});

// 计算“点”
function manipulateDoubleDecimal(a: number, b: number) {
  const isNegativeA = (+a < 0);
  const isNegativeB = (+b < 0);

  const stringA = String(a);
  const stringB = String(b);

  // 去除负号和小数点
  const cleanedStrA = stringA.replace(/[-.]/g, '');
  const cleanedStrB = stringB.replace(/[-.]/g, '');

  const addStrA = (isNegativeA ? '-' : '') + cleanedStrA.padEnd(6, '0');
  const addStrB = (isNegativeB ? '-' : '') + cleanedStrB.padEnd(6, '0') ;
  const movedA = +addStrA / 10;
  const movedB = +addStrB / 10;

  const result = round(movedA + movedB, 1);
  return result;
}
function calculatePoint() {
  const currentBuy = props.currentBuy;
  const currentSell = props.currentSell;
  const price = state.form.price;
  const subtractorPrice= props.transactionType === 'buy' ? price : price;
  const subtractedPrice = props.transactionType === 'buy' ? -currentBuy : +currentSell;
  return manipulateDoubleDecimal(subtractorPrice, subtractedPrice);
};

// 计算“价位”
function manipulateDecimal(a: number, b: number) {
  let decimalPlaces = getDecimalPlaces(a);

  // 将小数a乘以10的小数位数次方，移动小数点到倒数第二位
  let movedA = a * Math.pow(10, decimalPlaces - 1);
  let result = (movedA + b) / Math.pow(10, decimalPlaces - 1);
  result = parseFloat(result.toFixed(decimalPlaces));
  return result;
}
function calculatePrice() {
  const currentBuy = props.currentBuy;
  const currentSell = props.currentSell;
  
  const point = state.form.point;
  const subtractorPrice = props.transactionType === 'buy' ? currentBuy : currentSell;
  const subtractedPrice = props.transactionType === 'buy' ? +point : -point;
  return manipulateDecimal(subtractorPrice, subtractedPrice);
};

// 计算“盈亏”
function calculateProfit() {
  let result: string | number = '';
  const currentBuy = props.currentBuy;
  const currentSell = props.currentSell;
  const openPrice = props.transactionType === 'buy' ? currentBuy : currentSell;
  // profit = 平仓合约价值 - 建仓合约价值 + 手续费 + 过夜费
  // 建仓合约价值 = open_price X contract_size X volume / 100
  // 平仓合约价值 = close_price X contract_size X volume / 100
  const closePrice = state.form.price;
  const volume = props.volume;
  if (currentSymbol.value) {
    const { contract_size, storage, fee, digits } = currentSymbol.value;
    const buildingPrice = +(openPrice * contract_size * volume / 100).toFixed(digits);
    const closingPrice = +(closePrice * contract_size * volume / 100).toFixed(digits);
    result = closingPrice - buildingPrice + (storage || 0) + (fee || 0);
    result = result.toFixed(digits);
  }
  return result;
};

// 计算“余额”
const userStore = useUser();
const loginInfo = computed(() => userStore.loginInfo);
function calculateBalance() {
  let result: string | number = '';
  
  if (currentSymbol.value && loginInfo.value) {
    result = (state.form.profit * 100 / loginInfo.value.balance).toFixed(2);
  }
  return result;
};

</script>

<style lang="scss" scoped>
.linkage {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .item {
    display: flex;
    .linkageInput {
      flex: 1;
      border-radius: 8px;
    }
    .name {
      width: 100px;
      text-align: center;
    }
  }
}

.afterBtns {
  display: flex;
  flex-direction: column;

  & span {
    color: #7f7f7f;
  }

  & span:hover {
    color: #fff;
  }
}
</style>