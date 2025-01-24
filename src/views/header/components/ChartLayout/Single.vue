<template>
  <el-tooltip :content="$t('SingleImageMode')">
    <div class="iconbox" @click="chartInitStore.setLayoutType('single')">
      <BaseImg :iconName="type === 'single' ? 'icon_4a' : 'icon_4'"></BaseImg>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();

const type = computed(() => {
  console.log(
    "chartInitStore.state.chartLayoutType",
    chartInitStore.state.chartLayoutType
  );
  return chartInitStore.state.chartLayoutType;
});
</script>

<style lang="scss"></style>
