<template>
  <div class="aboutUs" @click="handleClick">
    <BaseImg class="logo" iconName="icon_16" />
    <span>{{ t("aboutUs") }}</span>
  </div>

  <el-dialog
    v-if="open"
    v-model="open"
    width="486"
    :zIndex="dialogStore.zIndex"
    append-to-body
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{ t("aboutUs") }}</span>
        <el-icon class="closeBtn" @click="close">
          <Close />
        </el-icon>
      </div>
    </template>
    <table>
      <tr>
        <td>
          <el-text type="info">{{ t("company") }}</el-text>
        </td>
        <td>
          <el-text>{{ t("companyName") }}</el-text>
        </td>
      </tr>
      <tr>
        <td>
          <el-text type="info">{{ t("account.email") }}</el-text>
        </td>
        <td><el-text>it.trader@uptech.info</el-text></td>
      </tr>
    </table>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { ref } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const dialogStore = useDialog();
const open = ref<boolean>(false);
const emit = defineEmits(["closeDropdown"]);

const handleClick = () => {
  emit("closeDropdown");
  dialogStore.incrementZIndex();
  open.value = true;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

table {
  margin: 24px 0 12px 0;

  tr {
    height: 36px;

    td:first-child {
      word-wrap: break-word;
      white-space: nowrap;
    }

    td {
      padding-right: 8px;
      vertical-align: middle;
    }
  }
}

.aboutUs {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 5px;
  align-items: center;
}

.header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .title {
    font-weight: bold;
    font-size: var(--icon-size);
    @include font_color("word");
  }

  .icon {
    cursor: pointer;
  }
}

:deep(.el-text.el-text--info) {
  width: 44px;
  display: inline-block;
}
</style>
