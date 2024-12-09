<template>
  <el-select-v2
    :suffix-icon="SelectSuffixIcon"
    v-model="model"
    :options="symbols"
    :props="{
      value: 'symbol',
      label: 'symbol',
    }"
    placeholder="品种"
    style="width: 100%"
    v-bind="selectOption"
    filterable
    @change="handleChange"
  >
    <template #default="{ item }">
      <slot name="option" :item="item"></slot>
    </template>
  </el-select-v2>
</template>

<script setup lang="ts">
import SelectSuffixIcon from "@/components/SelectSuffixIcon.vue";
import { useSymbols } from "@/store/modules/symbols";
import { computed, createApp, onMounted } from "vue";

const symbolsStore = useSymbols();

interface Props {
  title?: string;
  type?: "tradeAllow" | "default";
  selectOption?: object;
  subSymbol?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "品种",
  type: "default",
});

const emit = defineEmits(["change"]);

const model = defineModel();

onMounted(() => {
  const selectIcon = document.querySelector(".el-select__caret");
  const oldSvg = selectIcon?.querySelector("svg");
  const tempContainer = document.createElement("div");
  createApp(SelectSuffixIcon).mount(tempContainer);
  const newIcon = tempContainer.firstElementChild;
  if (newIcon && oldSvg) {
    selectIcon?.replaceChild(newIcon, oldSvg);
  }
});

const handleChange = (symbols: string[] | string) => {
  if (!props.subSymbol) {
    return;
  }
  if (typeof symbols === "object") {
    symbolsStore.selectSymbols = symbols;
  }
  if (typeof symbols === "string") {
    symbolsStore.selectSymbols = [symbols];
  }
};

const symbols = computed(() => {
  // 可交易品种
  if (props.type === "tradeAllow") {
    return symbolsStore.symbols_tradeAllow;
  }
  return symbolsStore.symbols;
});
</script>
