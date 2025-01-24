<template>
  <el-tooltip :content="$t('MultiGrapMode')">
    <div
      :class="[
        type === 'multiple' ? 'multipleActive' : 'multipleNoActive',
        'iconbox',
      ]"
      @click="chartInitStore.setLayoutType('multiple')"
    ></div>
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

<style lang="scss">
[data-theme="light"] .multipleNoActive {
  background-image: url("@/assets/icons/light/icon_5.svg");
}
[data-theme="light"] .multipleActive {
  background-image: url("@/assets/icons/light/icon_5a.svg");
}

[data-theme="dark"] .multipleNoActive {
  background-image: url("@/assets/icons/dark/icon_5.svg");
}
[data-theme="dark"] .multipleActive {
  background-image: url("@/assets/icons/dark/icon_5a.svg");
}
</style>
