<template>
  <el-tooltip :content="$t('VerticaLayout')">
    <div
      :class="[
        flexDirection === 'row' ? 'rowActive' : 'rowNoActive',
        'iconbox',
      ]"
      @click="chartInitStore.setLayoutType('row')"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();
const flexDirection = computed(() => chartInitStore.state.chartLayoutType);
</script>

<style lang="scss">
[data-theme="light"] .rowNoActive {
  background-image: url("@/assets/icons/light/icon_7.svg");
}
[data-theme="light"] .rowActive {
  background-image: url("@/assets/icons/light/icon_7a.svg");
}
[data-theme="dark"] .rowNoActive {
  background-image: url("@/assets/icons/dark/icon_7.svg");
}
[data-theme="dark"] .rowActive {
  background-image: url("@/assets/icons/dark/icon_7a.svg");
}
</style>
