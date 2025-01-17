<template>
  <el-tooltip :content="`${$t('createChart')} ${content}`">
    <div class="iconbox" @click="chartInitStore.addChart()"></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();

const content = computed(() => {
  const len = chartInitStore.state.chartWidgetList.length;
  const total = chartInitStore.chartMaxLength;
  return `${len}/${total}`;
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.iconbox {
  background-image: url("@/assets/icons/light/icon_8.svg");
  &:hover {
    @include background_color("background-hover");
  }
}
</style>
