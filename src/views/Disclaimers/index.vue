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
      <span class="header">{{ title }}</span>
    </template>
    <div
      class="disclaimers"
      v-loading="!htmlContent"
      v-html="htmlContent"
    ></div>
    <div class="footer" slot="footer">
      <el-checkbox v-model="agree">
        <span>{{ t("otp.accept") }}</span>
      </el-checkbox>
      <div class="footer_btnGroup">
        <el-button class="btn" @click="handleCancle">{{
          t("cancel")
        }}</el-button>
        <el-button
          class="btn"
          type="primary"
          :loading="loading"
          :disabled="!agree"
          @click="handleOk"
          >{{ t("accept") }}</el-button
        >
      </div>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import axios from "axios";

import { useDialog } from "@/store/modules/dialog";
import { useOrder } from "@/store/modules/order";

import { articleDetails, protocolAgree } from "api/account/index";
import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";

const dialogStore = useDialog();
const orderStore = useOrder();
const { t } = useI18n();

const agree = ref<boolean>(false);
const htmlContent = ref("");
const title = ref("");
const loading = ref(false);
// 清除HTML中的所有<style>标签及内容
const removeAllStyles = (html: string) => {
  if (!html) return "";

  // 正则匹配所有<style>标签（包括属性和内容）
  const styleRegex = /<style[\s\S]*?<\/style>/gi;
  return html.replace(styleRegex, "");
};

const getTitle = (html: string) => {
  if (!html) return "";
  // 正则匹配<title>标签
  const titleRegex = /<title>([\s\S]*?)<\/title>/i;
  const matchResult = html.match(titleRegex);

  // 返回标签内的内容（去除首尾空白）
  if (matchResult && matchResult[1]) {
    return matchResult[1].trim();
  }

  return "";
};
watch(
  () => dialogStore.visibles.disclaimersVisible,
  async (value) => {
    if (value) {
      const res = await articleDetails({
        columnCode: "quick_transactions",
        articleCode: "",
      });
      const url = res.data.url;
      const content = await axios({ url });
      const replacedHtml = removeAllStyles(content.data);
      const titleContent = getTitle(content.data);
      htmlContent.value = replacedHtml;
      title.value = titleContent;
    }
  }
);

const handleOk = async (e: MouseEvent) => {
  const currentLine = useNetwork().currentLine;
  const account = useUser().account;
  if (agree.value && currentLine) {
    loading.value = true;
    protocolAgree({
      columnCodes: ["quick_transactions"],
      brokerName: currentLine.brokerName,
      lineName: currentLine.lineName,
      login: account.login,
    })
      .then(() => {
        loading.value = false;
        dialogStore.closeDialog("disclaimersVisible");
        orderStore.setOneTrans(true);
      })
      .catch(() => {
        loading.value = false;
      });
    return;
  }
  ElMessage({
    type: "warning",
    message: t("tip.agreeTermsFirst"),
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
:deep(strong) {
  font-weight: bold;
}
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
  min-height: 200px;
  width: 100%;
  line-height: normal;
  @include border_color("border");
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
  height: var(--base-height);
}
</style>
