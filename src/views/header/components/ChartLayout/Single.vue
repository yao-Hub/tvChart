<template>
  <el-tooltip :content="$t('SingleImageMode')">
    <div class="iconbox" @click="type = !type">
      <BaseImg :iconName="type ? 'icon_4a' : 'icon_4'"></BaseImg>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
// import { useChartInit } from "@/store/modules/chartInit";
// import { computed, ref } from "vue";

// const chartInitStore = useChartInit();
import { ref } from "vue";

const type = ref(false);

// const type = computed(() => {
//   console.log(
//     "chartInitStore.state.chartLayoutType",
//     chartInitStore.state.chartLayoutType
//   );
//   return chartInitStore.state.chartLayoutType;
// });
</script>

<style lang="scss"></style>
