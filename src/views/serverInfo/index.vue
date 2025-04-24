<template>
  <el-dialog v-if="dialogStore.visibles.serverVisible" v-model="dialogStore.visibles.serverVisible" width="650"
    :zIndex="dialogStore.zIndex + 1" destroy-on-close :show-close="false" align-center @close="handleClose">
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{
          t("serverInfo.info")
        }}</span>
        <el-icon class="closeBtn" @click="close">
          <Close />
        </el-icon>
      </div>
    </template>

    <div v-loading="loading">
      <table>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.company") }}</el-text></td>
          <td><el-text>{{ getValue("brokerName") }}</el-text></td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.registrationNO") }}</el-text></td>
          <td><el-text>{{ getValue("registrationCode") }}</el-text></td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.registeredAddress") }}</el-text></td>
          <td><el-text>{{ getValue("brokerAddress") }}</el-text></td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.supervision") }}</el-text></td>
          <td><el-text>{{ getValue("regulatoryArea") }}</el-text></td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.officeLocation") }}</el-text></td>
          <td><el-text>{{ getValue("officeAddress") }}</el-text></td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.website") }}</el-text></td>
          <td>
            <el-text :type="serverInfo?.website ? 'primary' : ''" @click="openWebsite">
              {{ getValue("website") }}
            </el-text>
          </td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.generalEmail") }}</el-text></td>
          <td>
            <el-text>{{ getValue("generalEmail") }}</el-text>
            <BaseImg iconName="icon_copy" @click="handleCopy('generalEmail')" />
          </td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.abuseReportEmail") }}</el-text></td>
          <td>
            <el-text>{{ getValue("reportEmail") }}</el-text>
            <BaseImg iconName="icon_copy" v-if="serverInfo?.reportEmail" @click="handleCopy('reportEmail')" />
          </td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.telPrefix") }}</el-text></td>
          <td><el-text>{{ getValue("telPrefix") }}</el-text>
          </td>
        </tr>
        <tr>
          <td><el-text type="info">{{ t("serverInfo.telephone") }}</el-text></td>
          <td><el-text>{{ getValue("telephone") }}</el-text>
          </td>
        </tr>
      </table>
      <el-divider />
      <el-text class="tip" type="info">{{ t("serverInfo.tip") }}</el-text>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import useClipboard from "vue-clipboard3";

import { useDialog } from "@/store/modules/dialog";

import { queryBroker, IResQueryBroker } from "api/account";
import { useNetwork } from "@/store/modules/network";

const dialogStore = useDialog();
const { toClipboard } = useClipboard();
const { t } = useI18n();

const props = defineProps<{
  server: string;
  onClose: () => void;
}>();

const loading = ref(false);
const serverInfo = ref<IResQueryBroker>();
onMounted(async () => {
  try {
    loading.value = true;
    const res = await queryBroker({ brokerName: props.server });
    serverInfo.value = res.data;
  } finally {
    loading.value = false;
  }
});

const openWebsite = () => {
  if (serverInfo.value) {
    const website = serverInfo.value.website;
    useNetwork().openWebsite(`https://${website}`);
  }
};

const getValue = (key: keyof IResQueryBroker) => {
  if (serverInfo.value) {
    return serverInfo.value[key] || "-";
  }
  return "-";
};

const handleCopy = async (key: keyof IResQueryBroker) => {
  if (serverInfo.value) {
    const value = serverInfo.value[key];
    await toClipboard(value);
    ElMessage.success(t("tip.copySucceed"));
  }
};

const handleClose = () => {
  dialogStore.closeDialog("serverVisible");
  props.onClose();
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

table {
  margin: 24px 0 12px 0;

  tr {
    height: 36px;

    td {
      padding-right: 8px;
      vertical-align: middle;
    }
  }
}

.tip {
  margin: 8px 0;
  line-height: 24px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
  @include font_color("word-gray")
}

.icon_copy {
  margin-left: 10px;
  cursor: pointer;

  &:hover {
    color: var(--color-3);
  }
}
</style>
