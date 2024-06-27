<template>
  <a-modal title="平仓" :width="400" :open="props.visible" @cancel="handleCancel" @ok="handelOk">
    <a-form :model="formState" ref="formRef" :rules="rules">
      <a-form-item label="品种">
        <span>{{ props.orderInfo.symbol }}</span>
      </a-form-item>
      <a-form-item label="当前持仓手数">
        <span>{{ currentVolume }}手</span>
      </a-form-item>
      <a-form-item label="平仓手数" name="volume">
        <a-input-number v-model:value="formState.volume"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue';
import type { Rule } from 'ant-design-vue/es/form';
import { message } from 'ant-design-vue';
import type { FormInstance } from 'ant-design-vue';
import { resOrders, marketOrdersClose } from 'api/order/index';
import { useOrder } from '@/store/modules/order';

const orderStore = useOrder();

interface Props {
  visible: boolean
  orderInfo: resOrders
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
});
const emit = defineEmits();

const currentVolume = computed(() => {
  return props.orderInfo.volume / 100;
});

const validateVolume = async (_rule: Rule, value: string) => {
  if (value === '') {
    return Promise.reject('请输入手数');
  } else if (+value > currentVolume.value || +value < 0) {
    return Promise.reject("请输入合适范围的手数");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  volume: [{ required: true, validator: validateVolume, trigger: 'change' }],
};

const formState = reactive({
  volume: ''
});

const formRef = ref<FormInstance>();

const handleCancel = () => {
  formRef.value?.resetFields();
  emit('update:visible', false)
};

const handelOk = async () => {
  await formRef.value?.validate();
  const { id, symbol } = props.orderInfo;
  const res = await marketOrdersClose({
    symbol,
    id,
    volume: +formState.volume * 100
  });
  if (res.data.action_success) {
    message.success('平仓成功');
    handleCancel();
    orderStore.refreshOrderArea = true;
  }
};
</script>

<style lang="scss" scoped></style>
