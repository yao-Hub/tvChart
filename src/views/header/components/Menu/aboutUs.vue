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
    <template #header>
      <div class="header">
        <span class="title">{{ t("aboutUs") }}</span>
        <el-icon class="icon" @click="open = false">
          <CloseBold />
        </el-icon>
      </div>
    </template>
    <el-row>
      <el-col :span="24">
        <el-text type="info">{{ t("company") }}</el-text>
        <el-text>广州微派</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">Tel</el-text>
        <el-text>+86 8803 445</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">FaX</el-text>
        <el-text>+86 8803 445</el-text>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <el-text type="info">Web</el-text>
        <el-text>www.weipai.com</el-text>
      </el-col>
      <el-col :span="12">
        <el-text type="info">Email</el-text>
        <el-text>info@utrader.com</el-text>
      </el-col>
    </el-row>
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
.aboutUs {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 5px;
  align-items: center;
}
.el-row {
  margin-bottom: 16px;
}
.el-row:first-child {
  margin-top: 20px;
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
