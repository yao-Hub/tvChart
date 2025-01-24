<template>
  <el-tooltip :content="$t('MultiGrapMode')">
    <div class="iconbox" @click="chartInitStore.setLayoutType('multiple')">
      <BaseImg :iconName="type === 'multiple' ? 'icon_5a' : 'icon_5'"></BaseImg>
    </div>
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

<style lang="scss"></style>
