<template>
  <el-tooltip :content="$t('HorizontalLayout')">
    <div class="iconbox" @click="chartInitStore.setLayoutType('column')">
      <BaseImg :iconName="type === 'column' ? 'icon_6a' : 'icon_6'"></BaseImg>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();
const type = computed(() => chartInitStore.state.chartLayoutType);
</script>

<style lang="scss"></style>
