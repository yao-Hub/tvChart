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
import { reactive, computed, watch } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';
import { round } from 'utils/common/index';

interface Props {
  transactionType: 'buy' | 'sell' // 交易类型：买入卖出
  distanceTitle?: string
  orderType: 'limit' | 'stopLimit' | 'stop'
  ask: number
  bid: number
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

// 初始化价格
state.price = props.transactionType === 'buy' ? props.ask : props.bid;

// 检查价格是否合法
const validate = () => {
  const type = props.transactionType;
  let size = '';
  let result = false;
  if (type === 'buy') {
    if (props.orderType === 'limit') {
      size = '小与';
      result = +state.price <= props.ask;
    } else {
      size = '大与';
      result = +state.price >= props.ask;
    }
  }
  if (type === 'sell') {
    if (props.orderType === 'limit') {
      size = '大与';
      result = +state.price >= props.bid;
    } else {
      size = '小与';
      result = +state.price <= props.bid;
    }
  }
  state.errorMessage = !result ? `必须${size}${type === 'buy' ? '买价' : '卖价'}(${type === 'buy' ? props.ask : props.bid})` : '';
  return result;
}

// 距离 价差
const distance = computed(() => {
  const price = props.transactionType === 'buy' ? props.ask : props.bid;
  const entryPrice = +state.price;
  return round(Math.abs(price - entryPrice), 1);
});

const addPrice = () => {
  state.price = round(+state.price + 0.01, 2);
};

const reducePrice = () => {
  state.price = round(+state.price - 0.01, 2);
};

const emit = defineEmits([ 'entryPrice', 'entryPriceFail' ]);

watch(
  () => [state.price , props],
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