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
      <span class="header">一鍵交易-免責聲明</span>
    </template>
    <div class="disclaimers">
      <p class="title">免責聲明</p>
      <p class="section">
        您將要啟動快捷交易模式. 通過點擊下麵的“我接受這些條款”，
        您會承認您已經閱讀並理解以下契约條款，您同意特此遵守.
      </p>
      <p class="section">
        1.
        開啟時，用於提交訂單的交易模式是一個一步處理法：您的指令將被提交當您：<br />
        - 圖表的閃電下單面板<br />
        - 點擊交易看板的持倉訂單或掛單訂單的x進行快捷平倉或快捷撤單<br />
      </p>
      <p class="section">
        2.關閉時，訂單提交的默認模式為兩步處理法：您的指令將不會被提交當您：<br />
        - 點擊圖表的閃電下單面板的買入或賣出<br />
        - 點擊交易看板的持倉訂單或掛單訂單的“x”進行快捷平倉或快捷撤單<br />
        會有二次彈窗以確認提交您的訂單.
        您必須完成上述的兩種操作步驟才可提交訂單. <br />
      </p>
    </div>
    <div class="footer" slot="footer">
      <el-checkbox v-model="agree">
        <span>我接受這些條款條約</span>
      </el-checkbox>
      <div class="footer_btnGroup">
        <el-button class="btn" @click="handleCancle">取消</el-button>
        <el-button class="btn" type="primary" @click="handleOk">接受</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { useDisclaimers } from "./useDisclaimers";

const { handleOk, handleCancle, agree, dialogStore } = useDisclaimers();
</script>
