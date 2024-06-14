<template>
  <div class="Price">
    <div class="left">
      <span>数量</span>
      <span style="display: flex;">
        <a-auto-complete
          style="flex: 1; margin-right: 5px;"
          v-model:value="state.num"
          :options="state.numDataSource"
        >
          <template #option="item">
            {{ item.value }} 手
          </template>
        </a-auto-complete>
        <span>手</span>
      </span>
      <span>{{ typeOption[props.type] }}保证金</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

interface Props {
  type: 'buy' | 'sell';
};
const typeOption = {
  buy: '买入',
  sell: '卖出',
};
const props = withDefaults(defineProps<Props>(), {
  type: 'buy',
})
const emit = defineEmits(['numEnter']);

const state = reactive({
  num: 10,
  numDataSource: [
    { value: '0.01'},
    { value: '0.05'},
  ]
});

watch(() => state.num, (newVal) => {
  emit('numEnter', newVal);
}, { immediate: true });

const setNumDataSource = () => {
  state.numDataSource = [
    { value: '0.01'},
    { value: '0.05'},
  ];
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: (0.1 * i).toFixed(1).toString() });
  }
  // 添加1-9
  for (let i = 1; i <= 9; i++) {
    state.numDataSource.push({ value: i.toString() });
  }
  for (let i = 1; i <= 5; i++) {
    state.numDataSource.push({ value: (10 * i).toString() });
  }
  state.numDataSource.push({ value: '100'})
};
setNumDataSource();

</script>

<style lang="scss" scoped>
.Price {
  display: flex;
  width: 100%;
  .left {
    width: 50%;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}
</style>