<template>
  <a-dropdown v-model:open="visible">
    <LayoutOutlined />
    <template #overlay>
      <a-menu>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.chartsVisable">图表列表</a-checkbox>
        </a-menu-item>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.symbolsVisable">品种列表</a-checkbox>
        </a-menu-item>
        <a-menu-item>
          <a-checkbox v-model:checked="layoutStore.orderAreaVisable">订单列表</a-checkbox>
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LayoutOutlined } from '@ant-design/icons-vue';
import { useLayout } from '@/store/modules/layout';

const layoutStore = useLayout();

const visible = ref(false);
</script>
