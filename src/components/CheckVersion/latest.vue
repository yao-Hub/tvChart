<template>
  <div class="latest">
    <BaseImg iconName="update_logo" imgSuffix="png"></BaseImg>
    <el-text class="tip">{{
      t("update.versionHasLatest", { version: versionInfo?.version })
    }}</el-text>
    <el-button type="primary" class="comfirm" @click="closeDialog">{{
      t("ok")
    }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useUpdateVersion } from "./useUpdateVersion";

const { t, closeDialog, versionInfo } = useUpdateVersion();
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.latest {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.update_logo {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}
.tip {
  margin: 16px 0 24px 0;
}
.comfirm {
  width: 96px;
}
</style>
