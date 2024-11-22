<template>
  <el-select-v2
    v-model="model"
    :options="symbols"
    :props="{
      value: 'symbol',
      label: 'symbol',
    }"
    placeholder="品种"
    style="width: 100%"
    v-bind="selectOption"
  >
    <template #default="{ item }">
      <slot name="option" :item="item"></slot>
    </template>
  </el-select-v2>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useChartSub } from "@/store/modules/chartSub";

interface Props {
  title?: string;
  type?: "tradeAllow" | "default";
  selectOption?: object;
}

const subStore = useChartSub();

const props = withDefaults(defineProps<Props>(), {
  title: "品种",
  type: "default",
});

const emit = defineEmits(["change"]);

const model = defineModel();

const symbols = computed(() => {
  // 可交易品种
  if (props.type === "tradeAllow") {
    return subStore.symbols.filter((e) => e.trade_allow === 1);
  }
  return subStore.symbols;
});
</script>
