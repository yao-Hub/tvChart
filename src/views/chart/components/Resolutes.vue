<!-- 周期列表 -->
<template>
  <a-dropdown :trigger="['click']">
    <a-button type="text">{{ activeKey }}</a-button>
    <template #overlay>
      <a-menu @click="onClick">
        <a-menu-item v-for="(value, key) in RESOLUTES" :key="key">
          {{ value }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { RESOLUTES } from '@/constants/common';
import type { MenuProps } from 'ant-design-vue';
import { useChartAction } from '@/store/modules/chartAction';
import { ResolutionString } from 'public/charting_library/charting_library';

const chartActionStore = useChartAction();

const activeKey = ref('1');

const onClick: MenuProps['onClick'] = ({ key }) => {
  activeKey.value = String(key);
  chartActionStore.changeResolution({resolution: key as ResolutionString});
};
</script>
