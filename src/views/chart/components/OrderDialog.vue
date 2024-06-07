<template>
  <div>
    <a-modal v-model:open="open" :title="$t('order.new')" @ok="handleOk" @cancel="handleCancel">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useDialog } from '@/store/modules/dialog';

const dialogStore = useDialog();

const open = computed(() => {
  return dialogStore.orderDialogVisible;
});

const handleOk = () => {
  dialogStore.closeLoginDialog();
};
const handleCancel = () => {
  dialogStore.closeOrderDialog();
}
</script>
