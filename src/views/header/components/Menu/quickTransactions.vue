<template>
  <div class="transaction">
    <div class="transaction_left">
      <DollarCircleFilled />
      <span>{{ $t('QuickTransactions') }}</span>
    </div>
    <a-switch :checked="quiTransStore.ifQuick" size="small" @click="handleClick" />
  </div>

  <a-modal v-model:open="open" size="small" :footer="null">
    <span slot="title" style="font-size: 16px">一键交易</span>
    <div class="disclaimers">
      <p style="text-align: center;">免责声明</p>
      <p>您将要激活单击交易模式. 通过点击下面的"我接受这些合同条款", 您会承认您已经阅读并理解以下合同条款, 您同意特此遵守. </p>
      <p class="disclaimers_section">
        1. 开启时，用于提交订单的交易模式是一个一步处理法：您的指令将被提交当您：
        - 图表的闪电下单面板
        - 点击下单面板的买入或卖出按键
        -点击交易看板的持仓订单或挂单订单的x进行快捷平仓或快捷撤单
      </p>
      <p class="disclaimers_section">
        2.关闭时，订单提交的默认模式为两步处理法: 您的指令将不会被提交当您：
        - 点击图表的闪电下单面板的买入或卖出
        - 点击下单面板的买入或卖出按键
        -点击交易看板的持仓订单或挂单订单的“x”进行快捷平仓或快捷撤单
        会有二次弹窗以确认提交您的订单. 您必须完成上述的两种操作步骤才可提交订单.
      </p>
    </div>
    <div class="footer" slot="footer">
      <a-checkbox v-model:checked="agree">我接受这些条款</a-checkbox>
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

.disclaimers {
  background: #525252;
  border-radius: 5px;
  box-sizing: border-box;
  padding: 10px;
  margin: 15px 0;
  &_section {
    text-indent: 2em;
  }
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
