<template>
  <el-dialog
    v-if="dialogStore.visibles.serverVisible"
    v-model="dialogStore.visibles.serverVisible"
    width="450"
    :zIndex="dialogStore.zIndex + 1"
    destroy-on-close
    :show-close="false"
    align-center
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{
          t("serverInfo.info")
        }}</span>
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
    </template>

    <div></div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
</script>

<style lang="scss" scoped></style>
