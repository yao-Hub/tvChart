<template>
  <el-tooltip :content="$t('HorizontalLayout')">
    <div
      class="iconbox"
      :class="{ iconActive: flexDirection === 'row' }"
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
@import "@/styles/_handle.scss";
[data-theme="light"] .iconbox {
  background-image: url("@/assets/icons/light/icon_6.svg");
}
[data-theme="light"] .iconActive {
  background-image: url("@/assets/icons/light/icon_6a.svg");
}
[data-theme="dark"] .iconActive {
  background-image: url("@/assets/icons/dark/icon_6a.svg");
}
[data-theme="dark"] .iconbox {
  background-image: url("@/assets/icons/dark/icon_6.svg");
}
.iconbox :hover {
  @include background_color("background-hover");
}
</style>
