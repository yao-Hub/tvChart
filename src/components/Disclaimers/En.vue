<template>
  <el-dialog
    v-if="dialogStore.visibles.disclaimersVisible"
    v-model="dialogStore.visibles.disclaimersVisible"
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

<script lang="ts" setup>
import { useDisclaimers } from "./useDisclaimers";

const { handleOk, handleCancle, agree, dialogStore } = useDisclaimers();
</script>
