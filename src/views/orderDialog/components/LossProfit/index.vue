<template>
  <div class="lossProfit">
    <div class="stopLoss">
      <div class="chooseArea">
        <a-checkbox v-model:checked="state.stopLoss">止损</a-checkbox>
      </div>
      <linkage
        :showName="true"
        :disabled="state.stopLoss"
        :transactionType="props.transactionType"
        stopType="stopLoss"
        :currentBuy="props.currentBuy"
        :currentSell="props.currentSell">
      </linkage>
    </div>

    <div class="stopSurplus">
      <div class="chooseArea">
        <a-checkbox v-model:checked="state.stopSurplus">止盈</a-checkbox>
      </div>
      <linkage
        :disabled="state.stopSurplus"
        :transactionType="props.transactionType" 
        stopType="stopSurplus"
        :currentBuy="props.currentBuy"
        :currentSell="props.currentSell">
      </linkage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import linkage from './Linkage.vue';

const props = defineProps({
  transactionType: String,
  currentBuy: Number,
  currentSell: Number 
});

const state = reactive({
  stopSurplus: false,
  stopLoss: false,
  currentBuy: 0,
  currentSell: 0,
});
</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
}
.chooseArea {
  height: 27px;
}
</style>