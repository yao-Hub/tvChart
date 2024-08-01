<template>
  <a-radio-group v-model:value="state.type" class="radioGroup">
    <a-radio-button value="sell" class="sellRadio">
      <p>卖出</p>
      <p v-if="props.showPrice">{{ props.bid }}</p>
    </a-radio-button>
    <a-radio-button value="buy" class="buyRadio">
      <p>买入</p>
      <p v-if="props.showPrice">{{ props.ask }}</p>
    </a-radio-button>
  </a-radio-group>
  <span class="market" v-if="props.showPrice">
    点差: {{ spread }}; 高: {{ props.high }}; 低: {{ props.low }}
  </span>
</template>

<script setup lang="ts">
import { reactive, computed, watchEffect } from "vue";

interface Props {
  showPrice: boolean;
  bid: number;
  ask: number;
  high?: number;
  low?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showPrice: () => false,
  bid: 0,
  ask: 0,
  high: 0,
  low: 0,
});

const state = reactive({
  type: "buy",
});

const spread = computed(() => {
  const ask = props.ask;
  const bid = props.bid;
  return Math.abs(ask - bid).toFixed(2);
});

const emit = defineEmits(["switchType"]);
watchEffect(() => {
  emit("switchType", state.type);
});
</script>

<style lang="scss" scoped>
.ant-radio-button-wrapper {
  height: auto;
  flex: 1;
  text-align: center;
}
.radioGroup {
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: space-between;
  .buyRadio {
    flex: 1;
    color: #19b52d;
    text-align: center;
  }
  .sellRadio {
    flex: 1;
    color: #dd6600;
    text-align: center;
  }
}
.market {
  display: block;
  text-align: center;
  margin: 8px 0;
}
</style>
