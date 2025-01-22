<template>
  <el-tooltip :content="$t('HorizontalLayout')">
    <div
      class="iconbox"
      :class="[flexDirection === 'column' ? 'columnActive' : 'columnNoActive']"
      @click="chartInitStore.setLayoutType('column')"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();
const flexDirection = computed(() => chartInitStore.state.chartLayoutType);
</script>

<style lang="scss" scoped>
[data-theme="light"] .columnNoActive {
  background-image: url("@/assets/icons/light/icon_6.svg");
}
[data-theme="light"] .columnActive {
  background-image: url("@/assets/icons/light/icon_6a.svg");
}
[data-theme="dark"] .columnNoActive {
  background-image: url("@/assets/icons/dark/icon_6.svg");
}
[data-theme="dark"] .columnActive {
  background-image: url("@/assets/icons/dark/icon_6a.svg");
}
</style>
