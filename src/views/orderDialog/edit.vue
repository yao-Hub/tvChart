<template>
  <a-modal :title="title" :width="600" :open="props.visible" :bodyStyle="state.bodyStyle" @cancel="handleCancel" @ok="handelOk">
    <div class="edit">
      <a-menu
        class="menu"
        v-model:selectedKeys="state.selectedKeys"
        mode="inline"
        :items="state.items"
      ></a-menu>
      <div class="content">
        <span class="title">{{ title }}</span>
        <a-divider class="divider"></a-divider>
        <a-form :model="formState" ref="formRef" :rules="rules">
          <a-form-item label="订单id">
            <span>{{ props.orderInfo.id }}</span>
          </a-form-item>
          <a-form-item label="品种">
            <span>{{ props.orderInfo.symbol }}</span>
          </a-form-item>
          <template v-if="state.selectedKeys[0] === 'partialClose'">
            <a-form-item label="当前持仓手数">
              <span>{{ currentVolume }}手</span>
            </a-form-item>
            <a-form-item label="平仓手数" name="volume">
              <a-input-number v-model:value="formState.volume" :step="step"/>
            </a-form-item>
          </template>
          <template v-if="state.selectedKeys[0] === 'modifyStop'">
            <LossProfit
              :inputOption="{
                size: 'small'
              }"
              inline
              titleType="text"
              layout="vertical"
              :currentSymbolInfo="currentSymbolInfo"
              :transactionType="transactionType"
              :orderType="orderType"
              :bid="bid"
              :ask="ask"
              :orderPrice="orderPrice"
              @stopLoss="stopLoss"
              @stopSurplus="stopSurplus"
              @stopLossFail="stopLossFail"
              @stopSurplusFail="stopSurplusFail">
            </LossProfit>
          </template>
        </a-form>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type { Rule } from 'ant-design-vue/es/form';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';

import * as types from '#/chart/index';
import { resOrders, marketOrdersClose, editopenningOrders, reqEditOpeningOrders } from 'api/order/index';
import { getTradingDirection, getOrderType } from 'utils/order/index';
import { getDecimalPlaces } from 'utils/common/index';

import { useOrder } from '@/store/modules/order';
import { useChartSub } from '@/store/modules/chartSub';
import LossProfit from './components/LossProfit.vue';

const subStore = useChartSub();
const orderStore = useOrder();

interface Props {
  visible: boolean
  orderInfo: resOrders
  quote: types.Quote
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
});
const emit = defineEmits();

const state = reactive({
  selectedKeys: [ 'partialClose' ],
  items: [
    { key: 'partialClose', label: '部分平仓' },
    { key: 'modifyStop', label: '修改止盈止损' },
  ],
  bodyStyle: {
    backgroundColor: '#525252',
    borderRadius: '8px'
  },
  validList: {
    sl: true,
    tp: true
  }
});

const title = computed(() => {
  const { selectedKeys, items } = state;
  return items.find(e => e.key === selectedKeys[0])?.label;
});

const currentVolume = computed(() => {
  return props.orderInfo.volume / 100;
});

const step = computed(() => {
  let i = 1;
  if (props.orderInfo) {
    const places = getDecimalPlaces(props.orderInfo.volume / 100);
    i = i / Math.pow(10, places);
  }
  return String(i);
});

const validateVolume = async (_rule: Rule, value: string) => {
  if (value === '') {
    return Promise.reject('请输入手数');
  } else if (+value > currentVolume.value || +value <= 0) {
    return Promise.reject("请输入合适范围的手数");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  volume: [{ required: true, validator: validateVolume, trigger: 'change' }],
};

const formState = reactive({
  volume: '',
  tp: '',
  sl: ''
});

const formRef = ref<FormInstance>();

const handleCancel = () => {
  formRef.value?.resetFields();
  emit('update:visible', false)
};

const handelOk = async () => {
  const { id, symbol } = props.orderInfo;
  const { volume, tp, sl } = formState;
  if (state.selectedKeys[0] === 'partialClose') {
    await formRef.value?.validate();
    const res = await marketOrdersClose({
      symbol,
      id,
      volume: +volume * 100
    });
    if (res.data.action_success) {
      message.success('平仓成功');
      handleCancel();
      orderStore.refreshOrderArea = true;
    } else {
      message.error(res.data.err_text || '平仓失败')
    }
  }
  if (state.selectedKeys[0] === 'modifyStop') {
    if (!state.validList.sl || !state.validList.tp) {
      return;
    }
    const updata:reqEditOpeningOrders = { symbol, id };
    if (tp !== '') {
      updata.tp = +tp;
    }
    if (sl !== '') {
      updata.sl = +sl;
    }
    const res = await editopenningOrders(updata);
    if (res.data.action_success) {
      message.success('修改成功');
      handleCancel();
      orderStore.refreshOrderArea = true;
    } else {
      message.error(res.data.err_text || '修改失败')
    }
  }
};


const currentSymbolInfo = computed(() => {
  return subStore.symbols.find(e => e.symbol === props.orderInfo.symbol);
});
const transactionType = computed(() => {
  return getTradingDirection(props.orderInfo.type) as 'buy' | 'sell';
});
const orderType = computed(() => {
  return getOrderType(props.orderInfo.type);
});
const bid = computed(() => {
  return orderStore.currentQuotes[props.orderInfo.symbol].bid;
});
const ask = computed(() => {
  return orderStore.currentQuotes[props.orderInfo.symbol].ask;
});
const orderPrice = computed(() => {
  return transactionType.value === 'buy' ? ask.value : bid.value;
});
const stopLoss = (e: string) => {
  formState.sl = e;
  state.validList.sl = true;
};
const stopSurplus = (e: string) => {
  formState.tp = e;
  state.validList.tp = true;
};
const stopLossFail = () => {
  state.validList.sl = false;
};
const stopSurplusFail = () => {
  state.validList.tp = false;
};


</script>

<style lang="scss" scoped>
.divider {
  margin: 5px 0 10px 0;
}
.edit {
  display: flex;
  .menu {
    width: 135px;
    padding: 3px;
  }
  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    min-height: 300px;
    .title {
      font-size: 21px;
    }
  }
}
:deep(.ant-menu) {
  border-radius: 8px 0 0 8px;
}
:deep(.ant-menu-inline .ant-menu-item) {
  width: 100%;
  border-radius: 8px 0 0 8px;
  color: #fff;
}
:deep(.ant-menu-item-selected) {
  background-color: #525252;
}
:deep(.ant-form-item) {
  margin-bottom: 0;
}
</style>
