<template>
  <el-tooltip :content="$t('SingleImageMode')">
    <div
      class="iconbox"
      :class="[type === 'single' ? 'singleActive' : 'singleNoActive']"
      @click="chartInitStore.setLayoutType('single')"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();

const type = computed(() => {
  return chartInitStore.state.chartLayoutType;
});
</script>

<style lang="scss" scoped>
[data-theme="light"] .singleNoActive {
  background-image: url("@/assets/icons/light/icon_4.svg");
}
[data-theme="light"] .singleActive {
  background-image: url("@/assets/icons/light/icon_4a.svg");
}

[data-theme="dark"] .singleNoActive {
  background-image: url("@/assets/icons/dark/icon_4.svg");
}
[data-theme="dark"] .singleActive {
  background-image: url("@/assets/icons/dark/icon_4a.svg");
}
</style>
