<template>
  <a-select
    style="width: 100px"
    v-model:value="model"
    @change="handleChange"
    placeholder="品种"
    v-bind="props.selectOption"
    show-search
    :filter-option="filterOption"
  >
    <a-select-option :value="item.symbol" v-for="item in symbols">{{
      item.symbol
    }}</a-select-option>
  </a-select>
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

const filterOption = (input: string, option: any) => {
  const regex = new RegExp(input.split("").join(".*"), "i");
  return regex.test(option.value);
};

const handleChange = (value: string) => {
  model.value = value;
  emit("change", value);
};
</script>
