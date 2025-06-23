<template>
  <div class="header">
    <span class="title">{{ t("update.versionUpdate") }}</span>
    <BaseImg iconName="update" imgSuffix="png" catalog="images" />
  </div>
  <el-text type="info" class="tip">{{
    t("update.versionHasReleased", { version: nowVersion })
  }}</el-text>

  <div class="versionDetail scrollList">
    <el-text type="info">{{ versionInfo?.tips }} </el-text>
  </div>

  <div class="footer">
    <el-button @click="closeDialog">{{ t("close") }}</el-button>
    <el-button type="primary" @click="update">{{
      t("update.updateNow")
    }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useUpdateVersion } from "./useUpdateVersion";

const { t, closeDialog, update, versionInfo, nowVersion } = useUpdateVersion();
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.header {
  @include font_color("word");
  position: relative;
  .title {
    font-weight: 500;
    font-size: 24px;
  }
  .update {
    position: absolute;
    right: 0;
    transform: translateY(-50%);
    width: 160px;
    height: 160px;
  }
}
.tip {
  margin-top: 16px;
  display: block;
}
.versionDetail {
  margin: 32px 0;
  white-space: pre-wrap;
  line-height: 24px;
  min-height: 72px;
  max-height: 264px;
  overflow-y: auto;
}
.footer {
  display: flex;
  justify-content: flex-end;
}
</style>
