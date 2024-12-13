<template>
  <el-tooltip :content="$t('createChart')">
    <div class="iconbox" @click="chartInitStore.addChart()"></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";

const chartInitStore = useChartInit();
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
