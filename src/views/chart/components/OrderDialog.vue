<template>
  <div>
    <a-modal v-model:open="open" title="order" @ok="handleOk" @cancel="handleCancel">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import chartDialogStore from '@/store/modules/chartDialog';

const dialogStore = chartDialogStore();

const open = computed(() => {
  return dialogStore.orderDialogShow
})

const handleOk = () => {
  dialogStore.closeOrderDialog();
};
const handleCancel = () => {
  dialogStore.closeOrderDialog();
}
</script>
