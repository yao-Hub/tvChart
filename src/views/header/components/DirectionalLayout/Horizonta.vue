<template>
  <el-tooltip :content="$t('HorizontalLayout')">
    <div
      class="iconbox"
      :class="[flexDirection === 'row' ? 'active' : 'noActive']"
      @click="chartInitStore.setChartFlexDirection('row')"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();
const flexDirection = computed(() => chartInitStore.state.chartFlexDirection);
</script>

<style lang="scss" scoped>
[data-theme="light"] .noActive {
  background-image: url("@/assets/icons/light/icon_6.svg");
}
[data-theme="light"] .active {
  background-image: url("@/assets/icons/light/icon_6a.svg");
}
[data-theme="dark"] .noActive {
  background-image: url("@/assets/icons/dark/icon_6.svg");
}
[data-theme="dark"] .active {
  background-image: url("@/assets/icons/dark/icon_6a.svg");
}
</style>
