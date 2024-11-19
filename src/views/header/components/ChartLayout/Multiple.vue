<template>
  <el-tooltip :content="$t('MultiGrapMode')">
    <div
      class="iconbox"
      :class="{ iconActive: layoutType === 'multiple' }"
      @click="chartInitStore.setLayoutType('multiple')"
    ></div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
import { computed } from "vue";

const chartInitStore = useChartInit();
const layoutType = computed(() => chartInitStore.chartLayoutType);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.iconbox {
  background-image: url("@/assets/icons/icon_5.svg");
  &:hover {
    @include background_color("background-hover");
  }
}
.iconActive {
  background-image: url("@/assets/icons/icon_5a.svg");
}
</style>
