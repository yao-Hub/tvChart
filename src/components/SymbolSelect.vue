<template>
  <a-select v-model:value="model" @change="handleChange" v-bind="props.selectOption">
    <a-select-option :value="item.symbol" v-for="item in symbols">{{ item.symbol }}</a-select-option>
  </a-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChartSub } from '@/store/modules/chartSub';

interface Props {
  type?: 'tradeAllow' | 'default'
  selectOption?: object
}

const subStore = useChartSub();

const props = withDefaults(defineProps<Props>(), {
  type: 'default'
});

const emit = defineEmits([ 'change' ]);

const model = defineModel();

const symbols = computed(() => {
  // 可交易品种
  if (props.type === 'tradeAllow') {
    return subStore.symbols.filter(e => e.trade_allow === 1);
  }
  return subStore.symbols;
});

const handleChange = (value: string) => {
  model.value = value;
  emit('change', value);
}

</script>