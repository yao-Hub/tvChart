<template>
  <div class="EntryPrice">
    <span>入场价</span>
    <div :class="[state.errorMessage ? 'complete container' : 'container']">
      <a-tooltip :title="state.errorMessage">
        <a-input v-model:value="state.price">
          <template #addonAfter>
            <div class="afterBtns">
              <CaretUpFilled @click="addPrice" />
              <CaretDownFilled @click="reducePrice" />
            </div>
          </template>
        </a-input>
      </a-tooltip>
    </div>
    <span>{{ props.distanceTitle }}：{{ distance }}</span>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, nextTick } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';
import { round } from 'utils/common/index';
import { SessionSymbolInfo } from '#/chart/index';

interface Props {
  transactionType: 'buy' | 'sell' // 交易类型：买入卖出
  distanceTitle?: string
  orderType: 'limit' | 'stopLimit' | 'stop'
  ask: number
  bid: number
  currentSymbolInfo?: SessionSymbolInfo
}
interface State {
  price: number | string
  errorMessage: string
}

const props = withDefaults(defineProps<Props>(), {
  distanceTitle: '距离'
});
const state:State = reactive({
  price: '',
  errorMessage: ''
});

const digits = computed(() => {
  return props.currentSymbolInfo?.digits || 0;
});

const stopsLevel = computed(() => {
  return props.currentSymbolInfo?.stops_level || 1;
});

const getLeed = () => {
  const price =  props.transactionType === 'buy' ? props.ask : props.bid;
  const result_1 = price - 1 / Math.pow(10, +digits.value) * +stopsLevel.value;
  const result_2 = price + 1 / Math.pow(10, +digits.value) * +stopsLevel.value;
  return {
    result_1: round(result_1, 2),
    result_2: round(result_2, 2)
  };
};

// 初始化价格
const initPrice = async () => {
  const type = props.transactionType;
  const { result_1, result_2 } = getLeed();
  if (type === 'buy') {
    state.price = props.orderType === 'limit' ? result_1 : result_2;
  }
  if (type === 'sell') {
    state.price = props.orderType === 'limit' ? result_2 : result_1;
  }
  await nextTick();
  emit('entryPrice', state.price);
};
initPrice();

// 检查价格是否合法
const validate = () => {
  const type = props.transactionType;
  const { result_1, result_2 } = getLeed();
  let size = '';
  let value: string | number = '';
  let result = false;
  if (type === 'buy') {
    if (props.orderType === 'limit') {
      result = +state.price <= result_1;
      size = '≤';
      value = result_1;
    } else {
      result = +state.price >= result_2;
      size = '≥';
      value = result_2;
    }
  }
  if (type === 'sell') {
    if (props.orderType === 'limit') {
      result = +state.price >= result_2;
      size = '≥';
      value = result_2;
    } else {
      result = +state.price <= result_1;
      size = '≤';
      value = result_1;
    }
  }
  state.errorMessage = result ? '' : `价格必须${size}${value}`;
  return result;
}

// 距离 价差
const distance = computed(() => {
  const price = props.transactionType === 'buy' ? props.ask : props.bid;
  const entryPrice = +state.price;
  return round(Math.abs(price - entryPrice), 2);
});

const addPrice = () => {
  state.price = round(+state.price + 0.01, +digits.value);
};

const reducePrice = () => {
  state.price = round(+state.price - 0.01, +digits.value);
};

const emit = defineEmits([ 'entryPrice', 'entryPriceFail' ]);

watch(
  () => [state.price, props],
  () => {
    const valid = validate();
    if (valid) {
      emit('entryPrice', state.price);
    } else {
      emit('entryPriceFail');
    }
  },
  { immediate: true, deep: true, flush: 'post' }
);

</script>

<style lang="scss" scoped>
.EntryPrice {
  display: flex;
  width: 45%;
  flex-direction: column;
  .container {
    flex: 1;
    .afterBtns {
      display: flex;
      flex-direction: column;
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
  .complete {
    position: relative;
    &::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: #9f4747;
      z-index: 9;
      border-radius: 5px;
      opacity: 0.6;
      pointer-events: none;
    }
  }
}
</style>