<template>
  <div class="lossProfit">
    <div class="stopLoss">
      <div class="chooseArea">
        <a-checkbox v-model:checked="state.loss">止损</a-checkbox>
      </div>
      <linkage :showName="true" :disabled="state.loss"></linkage>
    </div>

    <div class="stopSurplus">
      <div class="chooseArea">
        <a-checkbox v-model:checked="state.surplus">止盈</a-checkbox>
      </div>
      <linkage :disabled="state.surplus"></linkage>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import linkage from './Linkage.vue';

const state = reactive({
  surplus: false,
  loss: false,
});
</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
  .stopLoss {
    // flex: 1;
  }
  .stopSurplus {
    // flex: 1;
  }
}
.chooseArea {
  height: 27px;
}
</style>