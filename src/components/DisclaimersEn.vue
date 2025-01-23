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
    @close="agree = false"
  >
    <template #header>
      <span class="header">One-Click Trading Disclaimer</span>
    </template>
    <div class="disclaimers">
      <p class="title">Disclaimer</p>
      <p class="section">
        You are about to activate the Quick Trading Mode. By clicking "I Accept
        These Terms" below, you acknowledge that you have read and understood
        the following contractual terms, and you hereby agree to comply with
        them.
      </p>
      <p class="section">
        When enabled, the trading mode used to submit orders is a one-step
        process: your order will be submitted when you:<br />
        - Use the instant order panel on the chart.<br />
        -Click the "x" on the position or pending order in the trading panel to
        quickly close a position or cancel an order.<br />
      </p>
      <p class="section">
        When disabled, the default mode for order submission is a two-step
        process: your order will not be submitted when you:<br />
        - Click "Buy" or "Sell" on the instant order panel on the chart.<br />
        -Click the "x" on the position or pending order in the trading panel to
        quickly close a position or cancel an order.<br />
        A secondary pop-up will appear to confirm the submission of your order.
        You must complete both steps in the process to submit your order. <br />
      </p>
    </div>
    <div class="footer" slot="footer">
      <el-checkbox v-model="agree">
        <span> I Accept These Terms and Conditions</span>
      </el-checkbox>
      <div class="footer_btnGroup">
        <el-button class="btn" @click="handleCancle">Cancel</el-button>
        <el-button class="btn" type="primary" @click="handleOk"
          >Accept</el-button
        >
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
  agree.value = false;
  orderStore.setOneTrans(false);
  dialogStore.closeDialog("disclaimersVisible");
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
