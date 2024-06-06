<template>
  <div class="FloatMenu" v-if="isMenuVisible" :style="{ top: `${menuTop + 10}px`, left: `${menuLeft - 150}px` }">
    <a-menu  @click="handleClick">
      <a-menu-item key="1st menu item">
        <span>1st menu item</span>
      </a-menu-item>
      <a-menu-divider />
      <a-menu-item key="2nd menu item">
        <span>2nd menu item</span>
      </a-menu-item>
      <a-menu-divider />
      <a-menu-item key="3rd menu item">3rd menu item</a-menu-item>
    </a-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import chartDialogStore from '@/store/modules/chartDialog';
import { message } from 'ant-design-vue';


const chartDialog = chartDialogStore();

const isMenuVisible = computed(() => chartDialog.floatMenuParams.visible);
const menuTop = computed(() => chartDialog.floatMenuParams.clientY);
const menuLeft = computed(() => chartDialog.floatMenuParams.clientX);

const handleClick = ({ key }: {key: string}) => {
  message.success(key);
  chartDialog.floatMenuParams.visible = false;
}
</script>

<style scoped lang="scss">
.FloatMenu {
  position: fixed;
  z-index: 1000;
}
</style>