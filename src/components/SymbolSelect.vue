<template>
  <el-select-v2
    :suffix-icon="SelectSuffixIcon"
    v-model="model"
    :options="symbols"
    :props="{
      value: 'symbol',
      label: 'symbol',
    }"
    :placeholder="t('order.symbol')"
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
import { computed, createApp, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const symbolsStore = useSymbols();

interface Props {
  symbolType?: "tradeAllow" | "default"; // 品种列表类型 tradeAllow：可交易 default：全部商品
  selectOption?: object;
  subSymbol?: boolean; // 是否监听选择品种
}

const props = withDefaults(defineProps<Props>(), {
  symbolType: "default",
});

const emit = defineEmits(["change"]);

const model = defineModel();

onMounted(() => {
  const selects = document.querySelectorAll(".el-select__caret");
  Array.from(selects).forEach((item) => {
    const oldSvg = item?.querySelector("svg");
    const tempContainer = document.createElement("div");
    createApp(SelectSuffixIcon).mount(tempContainer);
    const newIcon = tempContainer.firstElementChild;
    if (newIcon && oldSvg) {
      item?.replaceChild(newIcon, oldSvg);
    }
  });
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
  // 可交易商品
  if (props.symbolType === "tradeAllow") {
    return symbolsStore.symbolsTradeAllow;
  }
  return symbolsStore.haveQuoteSymbols;
});

onUnmounted(() => {
  symbolsStore.selectSymbols = [];
});
</script>
