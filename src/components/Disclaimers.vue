<template>
  <el-dialog
    v-if="dialogStore.disclaimersVisible"
    v-model="dialogStore.disclaimersVisible"
    width="900"
    :zIndex="dialogStore.zIndex"
    destroy-on-close
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <template #header>
      <span class="header">一键交易-免责声明</span>
    </template>
    <div class="disclaimers">
      <p class="title">免责声明</p>
      <p class="section">
        您将要激活快捷交易模式. 通过点击下面的"我接受这些条款",
        您会承认您已经阅读并理解以下合同条款, 您同意特此遵守.
      </p>
      <p class="section">
        1.
        开启时，用于提交订单的交易模式是一个一步处理法：您的指令将被提交当您：<br />
        - 图表的闪电下单面板<br />
        -点击交易看板的持仓订单或挂单订单的x进行快捷平仓或快捷撤单<br />
      </p>
      <p class="section">
        2.关闭时，订单提交的默认模式为两步处理法: 您的指令将不会被提交当您：<br />
        - 点击图表的闪电下单面板的买入或卖出<br />
        -点击交易看板的持仓订单或挂单订单的“x”进行快捷平仓或快捷撤单<br />
        会有二次弹窗以确认提交您的订单.
        您必须完成上述的两种操作步骤才可提交订单. <br />
      </p>
    </div>
    <div class="footer" slot="footer">
      <el-checkbox v-model="agree">
        <span>我接受这些条款条约</span>
      </el-checkbox>
      <div class="footer_btnGroup">
        <el-button class="btn" @click="handleCancle">取消</el-button>
        <el-button class="btn" type="primary" @click="handleOk">接受</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";
import { ElMessage } from "element-plus";
import { ref } from "vue";

const dialogStore = useDialog();
const orderStore = useOrder();

const agree = ref<boolean>(false);

const handleOk = (e: MouseEvent) => {
  if (agree.value) {
    dialogStore.closeDialog("disclaimersVisible");
    orderStore.setOneTrans(true);
    return;
  }
  ElMessage({
    type: "warning",
    message: `请先勾选同意条款`,
  });
};

const handleCancle = () => {
  dialogStore.closeDialog("disclaimersVisible");
  orderStore.setOneTrans(false);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.header {
  font-weight: bold;
  font-size: var(--icon-size);
  @include border_color("border");
}
.disclaimers {
  border-radius: 5px;
  box-sizing: border-box;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid;
  @include border_color("border");
  .section {
    margin: 15px 0;
    line-height: 24px;
    font-size: 14px;
    @include font_color("word");
  }
  .title {
    font-weight: 400;
    font-size: 18px;
    text-align: center;
    @include font_color("word");
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
.btn {
  height: var(--height);
}
</style>
