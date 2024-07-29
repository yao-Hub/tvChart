<template>
  <div class="transaction">
    <div class="transaction_left">
      <DollarCircleFilled />
      <span>快捷交易</span>
    </div>
    <a-switch :checked="quiTransStore.ifQuick" size="small" @click="handleClick"/>
  </div>

  <a-modal v-model:open="open" size="small" :footer="null">
    <span slot="title" style="font-size: 16px">一键交易</span>
    <div class="container">
      <p style="text-align: center;">免责声明</p>
      <p>.....</p>
    </div>
    <div class="footer" slot="footer">
      <a-checkbox v-model:checked="agree">我同意</a-checkbox>
      <div class="footer_btnGroup">
        <a-button type="primary" @click="handleOk">确定</a-button>
        <a-button @click="handleCancle">取消</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, h } from 'vue';
import { DollarCircleFilled } from '@ant-design/icons-vue';
import { useQuiTrans } from '@/store/modules/quickTransaction';
import { Modal } from 'ant-design-vue';

const open = ref<boolean>(false);
const agree = ref<boolean>(false);

const emit = defineEmits(['switchClick']);

const quiTransStore = useQuiTrans();
quiTransStore.getQuiTrans();

const handleClick = (checked: boolean) => {
  emit('switchClick');
  if (checked) {
    open.value = true;
    return;
  }
  quiTransStore.setQuiTrans(false);
};

const handleOk = (e: MouseEvent) => {
  if (agree.value) {
    open.value = false;
    quiTransStore.setQuiTrans(true);
    return;
  }
  Modal.info({
    content: h('div', {}, [
      h('p', '请先勾选同意条款'),
    ]),
    cancelButtonProps: {
      block: false
    }
  });
};

const handleCancle = () => {
  open.value = false;
};


</script>

<style lang="scss" scoped>
@import '@/assets/styles/_handle.scss';

.transaction {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 200px;

  &_left {
    display: flex;
    gap: 5px;
  }
}
.container {
  background: #525252;
  border-radius: 5px;
  box-sizing: border-box;
  padding: 10px;
  margin: 15px 0;
}
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  &_btnGroup {
    display: flex;
    gap: 5px;
  }
}
</style>
