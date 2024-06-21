<template>
  <div class="EntryPrice">
    <span>入场价</span>
    <div class="container">
      <a-tooltip :title="state.errorMessage" v-model:open="state.ifError">
        <a-input
          v-model:value="state.price"
          @change="handleChange">
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
  transactionType: string // 交易类型：买入卖出
  currentBuy: number // 当前买入价
  currentSell: number // 当前卖出价
  distanceTitle?: string
}
interface State {
  price: number | string
  ifError: boolean
  errorMessage: string
}

const props = withDefaults(defineProps<Props>(), {
  distanceTitle: '距离'
});
const state:State = reactive({
  price: '',
  ifError: false,
  errorMessage: ''
});

state.price = props.transactionType === 'buy' ? props.currentBuy : props.currentSell;

const distance = computed(() => {
  const price = props.transactionType === 'buy' ? props.currentBuy : props.currentSell;
  const entryPrice = +state.price;
  return round(Math.abs(price - entryPrice), 1);
});
const addPrice = () => {
  state.price = round(+state.price + 0.01, 2);
};
const reducePrice = () => {
  state.price = round(+state.price - 0.01, 2);
};

const emit = defineEmits([ 'entryPrice' ]);

watch(
  () => state.price,
  () => {
    emit('entryPrice', state.price)
  },
  { immediate: true }
);


const handleChange = () => {
  emit('entryPrice', state.price)
};
</script>

<style lang="scss" scoped>
.EntryPrice {
  display: flex;
  width: 45%;
  flex-direction: column;
  .container {
    flex: 1;
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
}
</style>