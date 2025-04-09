<template>
  <div class="header">
    <span class="title">{{ t("update.versionUpdate") }}</span>
    <BaseImg class="image" iconName="update" imgSuffix="png" catalog="images" />
  </div>
  <el-text type="info" class="tip">{{
    t("update.versionHasReleased", { version: versionInfo?.version })
  }}</el-text>

  <el-scrollbar class="versionDetail">
    <el-text type="info">{{ versionInfo?.tips }} </el-text>
  </el-scrollbar>

  <div class="footer">
    <el-button @click="closeDialog">{{ t("close") }}</el-button>
    <el-button type="primary" @click="update">{{
      t("update.updateNow")
    }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useUpdateVersion } from "./useUpdateVersion";

const { t, closeDialog, update, versionInfo } = useUpdateVersion();
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
  .image {
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
  max-height: 269px;
  white-space: pre-wrap;
  line-height: 24px;
}
.footer {
  display: flex;
  justify-content: flex-end;
}
</style>
