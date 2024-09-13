<template>
  <a-dropdown v-model:open="visible">
    <div class="layoutVisibled">
      <LayoutOutlined class="layoutVisibled_left" />
      <DownOutlined class="layoutVisibled_right" />
    </div>
    <template #overlay>
      <a-menu>
        <a-menu-item>
          <a-checkbox
            v-model:checked="layoutStore.chartsVisable"
            @change="(e: any) => checkboxChange(e, 'chartList')"
            >{{ $t("chartList") }}</a-checkbox
          >
        </a-menu-item>
        <a-menu-item>
          <a-checkbox
            v-model:checked="layoutStore.symbolsVisable"
            @change="checkboxChange"
            >{{ $t("symbolList") }}</a-checkbox
          >
        </a-menu-item>
        <a-menu-item>
          <a-checkbox
            v-model:checked="layoutStore.orderAreaVisable"
            @change="checkboxChange"
            >{{ $t("orderList") }}</a-checkbox
          >
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { LayoutOutlined, DownOutlined } from "@ant-design/icons-vue";
import {
  hideNoChildDragAreaItem,
  showNoChildDragAreaItem,
} from "@/utils/dragResize/drag";

import { useLayout } from "@/store/modules/layout";
import { useChartInit } from "@/store/modules/chartInit";
const chartInitStore = useChartInit();

const visible = ref(false);

const layoutStore = useLayout();

const checkboxChange = async (e: any, type: string) => {
  const checked = e.target.checked;
  await nextTick();
  if (type === "chartList" && checked) {
    setTimeout(() => chartInitStore.setSymbolBack(), 200);
  }
  if (checked) {
    showNoChildDragAreaItem();
  } else {
    hideNoChildDragAreaItem();
  }
};
</script>

<style lang="scss" scoped>
.layoutVisibled {
  display: flex;
  align-items: center;

  &_left {
    width: 16px;
    height: 16px;
  }

  &_right {
    width: 4px;
    height: 2px;
  }
}
</style>
