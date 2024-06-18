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
        :currentSell="props.currentSell"
        :selectedSymbol="props.selectedSymbol"
        :tradeAllowSymbols="props.tradeAllowSymbols"
        :volume="props.volume"
        @priceChange="(e) => stopChange(e, 'stopLoss')">
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
        :currentSell="props.currentSell"
        :selectedSymbol="props.selectedSymbol"
        :tradeAllowSymbols="props.tradeAllowSymbols"
        :volume="props.volume"
        @priceChange="(e) => stopChange(e, 'stopSurplus')">
      </linkage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import linkage from './Linkage.vue';
import { SessionSymbolInfo } from '#/chart/index';

type SymbolStrings = Props['tradeAllowSymbols'][number]['symbol'];
interface Props {
  transactionType: string,
  currentBuy: number,
  currentSell: number,
  tradeAllowSymbols: SessionSymbolInfo[],
  selectedSymbol: SymbolStrings
  volume: number
}

const props = defineProps<Props>();

const state = reactive({
  stopSurplus: false,
  stopLoss: false,
  currentBuy: 0,
  currentSell: 0,
});


const emit = defineEmits(['stopLoss', 'stopSurplus']);
const stopChange = (value: string, type: 'stopLoss' | 'stopSurplus') => {
  emit(type, value);
}
</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
  justify-content: center;
}
.chooseArea {
  height: 27px;
}
</style>