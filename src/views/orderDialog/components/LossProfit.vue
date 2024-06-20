<template>
  <div class="lossProfit">
    <div class="chooseArea">
      <a-checkbox v-model:checked="state.stopLoss.disabled">止损</a-checkbox>
      <a-input
        v-model:value="state.stopLoss.value"
        :disabled="!state.stopLoss.disabled">
      </a-input>
    </div>
    <div class="chooseArea">
      <a-checkbox v-model:checked="state.stopSurplus.disabled">止盈</a-checkbox>
      <a-input
        v-model:value="state.stopSurplus.value"
        :disabled="!state.stopSurplus.disabled">
      </a-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watchEffect } from 'vue';

const emits = defineEmits([ 'stopLoss', 'stopSurplus' ]);

const state = reactive({
  stopLoss: {
    disabled: false,
    value: '',
  },
  stopSurplus: {
    disabled: false,
    value: '',
  },
});

watchEffect(() => {
  emits('stopLoss', state.stopLoss.value);
  emits('stopSurplus', state.stopSurplus.value);
});

</script>

<style lang="scss" scoped>
.lossProfit {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.chooseArea {
  display: flex;
  flex-direction: column;
}
</style>