<template>
  <a-dropdown :trigger="['click']" v-model:open="visible">
    <LayoutOutlined />
    <template #overlay>
      <a-menu>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.chartsVisable" @change="checkboxChange">图表列表</a-checkbox>
        </a-menu-item>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.symbolsVisable" @change="checkboxChange">品种列表</a-checkbox>
        </a-menu-item>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.orderAreaVisable" @change="checkboxChange">订单列表</a-checkbox>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { LayoutOutlined } from '@ant-design/icons-vue';
import { useLayout } from '@/store/modules/layout';
import { resizeUpdate } from '../dragResize';
import { useChartInit } from '@/store/modules/chartInit';
const chartInitStore = useChartInit();

const visible = ref(false);

const layoutStore = useLayout();

const checkboxChange = async (e: any) => {
  const ifCheck = e.target.checked;
  // if (!ifCheck) {
  // } else {
  //   chartInitStore.setCacheSymbol();
  // }
  if (ifCheck) {
    chartInitStore.setChartSymbolWithCache();
  }
  await nextTick();
  resizeUpdate(true);
};

</script>
