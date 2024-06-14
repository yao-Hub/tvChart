<template>
  <div class="linkage">
    <div v-for="(value, key) in state.form" :key="key" class="item">
      <a-input v-model:value="state.form[key]" :disabled="!props.disabled" @change="handleChange(key)">
        <template #prefix v-if="state.focusKey !== key">
          <span>~</span>
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
      <span v-if="props.showName" class="name">{{ $t(`order.${key}`) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, watchEffect } from 'vue';
import { CaretUpFilled, CaretDownFilled } from '@ant-design/icons-vue';
interface Props {
  showName?: Boolean // 显示后缀的名字
  disabled: Boolean // 输入框disabled
  transactionType: string // 交易类型：买入卖出
  stopType: string // 止亏 or 止盈
  currentBuy: number // 当前买入价
  currentSell: number // 当前卖出价
}

const props = withDefaults(defineProps<Props>(), {
  showName: () => false,
  disabled: () => false,
  transactionType: '',
  stopType: '',
  currentBuy: 0,
  currentSell: 0
});

const state = reactive({
  form: {
    point: '',
    price: '',
    // balance: '',
    // profit: ''
  } as Record<string, any>,
  pointCache: '',
  focusKey: ''
});

const addNum = (key: string) => {
  const currentNum = state.form[key] * 1;
  state.form[key] = `${currentNum + 1}`;
  state.focusKey = key;
};
const reduceNum = (key: string) => {
  const currentNum = state.form[key] * 1;
  state.form[key] = `${currentNum - 1}`;
  state.focusKey = key;
};
const handleChange = (key: string) => {
  state.focusKey = key;
};

watch(() => props.disabled, (newVal) => {
  if (!newVal) {
    for (const i in state.form) {
      state.form[i] = '';
    }
    return;
  }
  state.form.point = state.pointCache || (props.stopType === 'stopLoss' ? '-100' : '100');
});

watch(() => state.form.point, (newVal) => {
  if (props.disabled) {
    state.pointCache = newVal;
  }
});

function manipulateDecimal(a: number, b: number) {
  // 获取小数位数
  let decimalPlaces = getDecimalPlaces(a);

  // 将小数a乘以10的小数位数次方，移动小数点到倒数第二位
  let movedA = a * Math.pow(10, decimalPlaces - 1);

  // 减去常数b
  let result = (movedA + b) / Math.pow(10, decimalPlaces - 1);

  // 使用 toFixed() 方法将结果保留小数点后的位数
  result = parseFloat(result.toFixed(decimalPlaces));

  // 返回结果
  return result;
}

// 辅助函数：获取一个数的小数位数
function getDecimalPlaces(num: number) {
  // 先将数字转换成字符串，以便进行操作
  let strNum = num.toString();
  // 判断是否存在小数点
  let decimalIndex = strNum.indexOf('.');
  // 如果不存在小数点，则返回0
  if (decimalIndex === -1) {
    return 0;
  }
  // 否则，返回小数点后的位数
  return strNum.length - decimalIndex - 1;
}

watchEffect(() => {
  if (!props.disabled) {
    return;
  }
  const currentBuy = props.currentBuy;
  // const currentSell = props.currentSell;
  // console.log('currentBuy', props.currentBuy, currentBuy)
  switch (props.transactionType) {
    case 'buy':
      state.form.price = manipulateDecimal(currentBuy, Number(state.form.point));
      break;
    case 'sell':
      break;
    default:
      break;
  }

}, { flush: 'sync' });

</script>

<style lang="scss" scoped>
.linkage {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .item {
    display: flex;

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