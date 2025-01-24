<template>
  <div v-for="item in layoutList">
    <el-tooltip :content="$t(`layout.${item.type}`)">
      <div class="iconbox" @click="chartInitStore.setLayoutType(item.type)">
        <BaseImg :iconName="getIcon(item)"></BaseImg>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();

interface IList {
  type: "single" | "multiple" | "row" | "column";
  activeIcon: string;
  noActiveIcon: string;
}

const layoutList: IList[] = [
  {
    type: "single",
    activeIcon: "icon_4a",
    noActiveIcon: "icon_4",
  },
  {
    type: "multiple",
    activeIcon: "icon_5a",
    noActiveIcon: "icon_5",
  },
  {
    type: "column",
    activeIcon: "icon_6a",
    noActiveIcon: "icon_6",
  },
  {
    type: "row",
    activeIcon: "icon_7a",
    noActiveIcon: "icon_7",
  },
];
const getIcon = (item: IList) => {
  const layout = chartInitStore.state.chartLayoutType;
  return item.type === layout ? item.activeIcon : item.noActiveIcon;
};
</script>

<style lang="scss" scoped></style>
