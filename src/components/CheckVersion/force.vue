<template>
  <div class="force">
    <BaseImg iconName="icon_cue" imgSuffix="png"></BaseImg>
    <el-text>{{ t("update.mustUpdate") }}</el-text>
    <el-scrollbar height="160px" class="scrollBar">
      <div class="box">
        <el-text type="info">{{ versionInfo?.tips }} </el-text>
      </div>
    </el-scrollbar>
    <el-button type="primary" class="updateBtn" @click="update">{{
      t("update.updateNow")
    }}</el-button>
  </div>
</template>

<script setup lang="ts">
import { useUpdateVersion } from "./useUpdateVersion";

const { t, update, versionInfo } = useUpdateVersion();
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.force {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.icon_cue {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}
.box {
  width: 100%;
  height: 100%;
  white-space: pre-wrap;
  line-height: 24px;
  padding: 16px;
  box-sizing: border-box;
}
.scrollBar {
  width: 100%;
  @include background_color("background");
  @include border_color("border");
  border: 1px solid;
  border-radius: 4px;
  margin: 24px 0;
}
.updateBtn {
  width: 100%;
}
</style>
