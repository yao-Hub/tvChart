<template>
  <div class="footerInfo">
    <div class="item">
      <span>余额：</span>
      <span>{{ loginInfo?.balance }}</span>
    </div>
    <div class="item">
      <span>净值：</span>
      <span>{{ equity }}</span>
    </div>
    <div class="item">
      <span>保证金：</span>
      <span>{{ Margin }}</span>
    </div>
    <div class="item">
      <span>可用保证金：</span>
      <span>{{ margin_free }}</span>
    </div>
    <div class="item">
      <span>保证金水平：</span>
      <span>{{ margin_level }}</span>
    </div>
    <div class="item">
      <span>账户总盈亏：</span>
      <span>{{ profit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useUser } from '@/store/modules/user';
import { useOrder } from '@/store/modules/order';
// import { useChartSub } from '@/store/modules/chartSub';
import { round } from 'utils/common/index';

// const subStore = useChartSub();
const userStore = useUser();
const orderStore = useOrder();

const loginInfo = computed(() => userStore.loginInfo);

// 净值
const equity = computed(() => {
  try {
    if (!loginInfo.value) {
      return '-';
    }
    const currentPosition = orderStore.tableData.position;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + currentValue.profit;
    }, 0);
    return round(+loginInfo.value.balance + (sum || 0), 2);
  } catch (error) {
    return '-';
  }
});

// 保证金
const Margin = computed(() => {
  try {
    if (!loginInfo.value) {
      return '-';
    }
    return loginInfo.value.margin;
    // const currentPosition = orderStore.tableData.position;
    // const sum = currentPosition?.reduce((accumulator, item) => {
    //   let result = 0;
    //   const symbol = subStore.symbols.find(e => e.symbol === item.symbol);
    //   if (symbol) {
    //     const leverage = symbol.leverage;
    //     const margin = symbol.margin;
    //     if (leverage) {
    //       result = +item.open_price * symbol.contract_size / leverage * item.volume / 100;
    //     } else {
    //       result = margin * item.volume / 100;
    //     }
    //     return accumulator + result;
    //   } else {
    //     return accumulator;
    //   }
    // }, 0);
    // return round(sum || 0, 2);
  } catch (error) {
    return '-'
  }
});

// 可用保证金
const margin_free = computed(() => {
  if (equity.value !== '-' && Margin.value !== '-') {
    return round(Number(equity.value) - Number(Margin.value), 2);
  }
  return '-';
});

// 保证金水平
const margin_level = computed(() => {
  if (+Margin.value === 0) {
    return 0;
  }
  if (equity.value !== '-' && Margin.value !== '-') {
    return round(+equity.value / +Margin.value * 100, 2);
  }
  return '-';
});

// 总盈亏
const profit =  computed(() => {
  try {
    if (!loginInfo.value) {
      return '-';
    }
    const currentPosition = orderStore.tableData.position;
    const sum = currentPosition?.reduce((accumulator, currentValue) => {
      return accumulator + Number(currentValue.profit);
    }, 0);
    return round(sum || 0, 2);
  } catch (error) {
    return '-';
  }
});

</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.footerInfo {
  display: flex;
  width: 100vw;
  box-sizing: border-box;
  height: 30px;
  @include background_color('primary');
  .item {
    flex: 1;
    border-right: 1px solid;
    @include border_color('border');
    display: flex;
    align-items: center;
    padding-left: 20px;
    height: 80%;
  }
}
</style>
