<template>
  <el-dialog
    v-if="dialogStore.visibles.serverVisible"
    v-model="dialogStore.visibles.serverVisible"
    width="650"
    :zIndex="dialogStore.zIndex + 1"
    destroy-on-close
    :show-close="false"
    align-center
    @close="handleClose"
  >
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

    <div v-loading="loading" style="min-height: 300px">
      <table>
        <tr v-for="item in tableColumns">
          <template v-if="getValue(item.prop)">
            <td>
              <el-text type="info">{{ item.label }}</el-text>
            </td>
            <td v-if="['generalEmail', 'reportEmail'].includes(item.prop)">
              <el-text type="info">{{ getValue(item.prop) }}</el-text>
              <BaseImg
                iconName="icon_copy"
                @click="copy(item.prop)"
                :title="t('account.copy')"
              />
            </td>
            <td v-else-if="item.prop === 'telephone'">
              <el-text type="info"
                >{{ getValue("telPrefix") }},{{
                  getValue("telephone")
                }}</el-text
              >
            </td>
            <td v-else-if="item.prop === 'website'">
              <el-text type="primary" @click="openWebsite">{{
                getValue("website")
              }}</el-text>
            </td>
            <td v-else>
              <el-text type="info">{{ getValue(item.prop) }}</el-text>
            </td>
          </template>
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

type TKey = keyof IResQueryBroker;

const dialogStore = useDialog();
const { toClipboard } = useClipboard();
const { t } = useI18n();

const props = defineProps<{
  server: string;
  onClose: () => void;
}>();

const loading = ref(false);
const serverInfo = ref<IResQueryBroker>();
const tableColumns: Array<{
  prop: TKey;
  label: string;
}> = [
  {
    prop: "brokerName",
    label: t("serverInfo.company"),
  },
  {
    prop: "registrationCode",
    label: t("serverInfo.registrationNO"),
  },
  {
    prop: "brokerAddress",
    label: t("serverInfo.registeredAddress"),
  },
  {
    prop: "regulatoryArea",
    label: t("serverInfo.supervision"),
  },
  {
    prop: "officeAddress",
    label: t("serverInfo.officeLocation"),
  },
  {
    prop: "website",
    label: t("serverInfo.website"),
  },
  {
    prop: "generalEmail",
    label: t("serverInfo.generalEmail"),
  },
  {
    prop: "reportEmail",
    label: t("serverInfo.abuseReportEmail"),
  },
  {
    prop: "telephone",
    label: t("serverInfo.telephone"),
  },
];

onMounted(async () => {
  try {
    loading.value = true;
    const res = await queryBroker({ brokerName: props.server });
    serverInfo.value = res.data;
  } finally {
    loading.value = false;
  }
});

const getValue = (key: TKey) => {
  if (serverInfo.value) {
    return serverInfo.value[key] || "";
  }
  return "";
};

const openWebsite = () => {
  if (serverInfo.value) {
    const website = serverInfo.value.website;
    useNetwork().openWebsite(`https://${website}`);
  }
};

const copy = async (key: TKey) => {
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
    td:first-child {
      word-wrap: break-word;
      white-space: nowrap;
    }

    td {
      line-height: normal;
      padding: 4px 4px 4px 0;
    }
  }
}

.tip {
  margin: 8px 0;
  line-height: 24px;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-all;
  @include font_color("word-gray");
}

.icon_copy {
  margin-left: 10px;
  cursor: pointer;
  @include font_color("word-gray");

  &:hover {
    @include font_color("primary");
  }
}
</style>
