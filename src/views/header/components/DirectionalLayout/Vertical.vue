<template>
  <el-tooltip :content="$t('VerticaLayout')">
    <div
      class="iconbox"
      :class="{ iconActive: flexDirection === 'column' }"
      @click="chartInitStore.setChartFlexDirection('column')"
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
@import "@/styles/_handle.scss";

.iconbox {
  background-image: url("@/assets/icons/icon_7.svg");
  &:hover {
    @include background_color("background-hover");
  }
}
.iconActive {
  background-image: url("@/assets/icons/icon_7a.svg");
}
</style>
