<template>
  <el-tooltip :content="$t('VerticaLayout')">
    <div class="iconbox" @click="chartInitStore.setLayoutType('row')">
      <BaseImg :iconName="type === 'row' ? 'icon_7a' : 'icon_7'"></BaseImg>
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
