<template>
  <div>
    <a-modal v-model:open="open" :title="$t('order.new')" @ok="handleOk" @cancel="handleCancel" class="modal" :footer="null">
      <div class="main">
        <a-menu
          class="left"
          v-model:selectedKeys="state.selectedKeys"
          mode="inline"
          :inline-collapsed="state.collapsed"
          :items="items"
        ></a-menu>
        <div class="right">
          
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
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

const state = reactive({
  collapsed: false,
  selectedKeys: ['1'],
  preOpenKeys: ['sub1'],
});

const items = reactive([
  {
    key: '1',
    label: '市价单',
  },
  {
    key: '2',
    label: '限价单',
  },
  {
    key: '3',
    label: '止损单',
  },
  {
    key: '4',
    label: '止损限价单',
  },
]);
</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';

.main {
  display: flex;
  width: 100%;
}
.left {
  max-width: 129px !important;
  min-width: 129px !important;
  @include font_color('word');
}
.right {
  flex: 1;
}
</style>