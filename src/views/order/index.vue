<template>
  <div>
    <a-modal
      v-model:open="open"
      :title="title"
      @ok="handleOk"
      @cancel="handleCancel"
      :bodyStyle="state.bodyStyle"
      :footer="null">
      <div class="main">
        <a-menu
          class="left"
          v-model:selectedKeys="state.selectedKeys"
          mode="inline"
          :inline-collapsed="state.collapsed"
          :items="state.items"
        ></a-menu>
        <div class="right">
          <div class="title">新{{ title }}</div>
          <a-divider style="margin: 5px 0 10px 0;"></a-divider>
          <a-select v-model:value="orderStore.currentSymbol">
            <a-select-option :value="item.symbol" v-for="item in subStore.symbols">{{ item.symbol }}</a-select-option>
          </a-select>
          <div class="btnGroup">
            <BaseButton type="error">
              <div>
                <p>买入</p>
                <p>{{ quote?.bid }}</p>
              </div>
            </BaseButton>
            <BaseButton type="success">
              <div>
                <p>卖出</p>
                <p>{{ quote?.ask }}</p>
              </div>
            </BaseButton>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, watch, ref } from 'vue';
import { useDialog } from '@/store/modules/dialog';
import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';

import { allSymbolQuotes, ResQuote } from 'api/symbols/index';

import BaseButton from '@/components/BaseButton.vue'

const dialogStore = useDialog();
const orderStore = useOrder();
const subStore = useChartSub();

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
  selectedKeys: ['price'],
  preOpenKeys: ['sub1'],
  bodyStyle: {
    backgroundColor: '#525252',
    borderRadius: '8px'
  },
  items: [
    { key: 'price', label: '市价单' },
    { key: 'limit', label: '限价单' },
    { key: 'stop', label: '止损单' },
    { key: 'stopLimit', label: '止损限价单' },
  ]
});

const quote = ref<ResQuote>();

const title = computed(() => {
  const item = state.items.find(e => e.key === state.selectedKeys[0]);
  return item?.label
});

const getQuotes = async () => {
  const res = await allSymbolQuotes({ server: 'upway-live' });
  const foundQuote = res.data.find(e => e.symbol === orderStore.currentSymbol);
  foundQuote && (quote.value = foundQuote);
  console.log('foundQuote', foundQuote);
};
watch(open, (newVal) => {
  newVal && getQuotes();
});

watch(() => orderStore.currentQuote, (newVal) => {
  if (newVal && newVal.symbol === orderStore.currentSymbol) {
    quote.value = newVal;
  }
}, { immediate: true });

</script>

<style scoped lang="scss">
@import '@/assets/styles/_handle.scss';

.main {
  display: flex;
  width: 100%;
  padding: 3px;
}
.left {
  max-width: 129px !important;
  min-width: 129px !important;
  // @include font_color('word');
}
.right {
  flex: 1;
  .title {
    font-size: 21px;
  }
  .btnGroup {
    display: flex;
    justify-content:space-evenly;
  }
}
:deep(.ant-menu) {
  border-radius: 8px 0 0 8px;
}
:deep(.ant-menu-inline .ant-menu-item) {
  width: calc(100% - 3px);
  border-radius: 8px 0 0 8px;
  color: #fff;
}
:deep(.ant-menu-item-selected) {
  background-color: #525252;
}
.right {
  padding: 10px
}
</style>