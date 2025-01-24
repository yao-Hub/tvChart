<template>
  <el-tooltip :content="`${$t('createChart')} ${content}`">
    <div class="iconbox" @click="chartInitStore.addChart()">
      <BaseImg iconName="icon_8"></BaseImg>
    </div>
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

<style lang="scss" scoped></style>
