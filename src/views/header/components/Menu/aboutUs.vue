<template>
  <div class="aboutUs" @click="handleClick">
    <BaseImg class="logo" iconName="icon_16" />
    <span>{{ $t("aboutUs") }}</span>
  </div>

  <el-dialog
    v-model="open"
    width="486"
    :zIndex="dialogStore.zIndex"
    @open="dialogStore.incrementZIndex"
    destroy-on-close
    append-to-body
    @close="open = false"
  >
    <template #header>
      <span class="header">{{ $t("aboutUs") }}</span>
    </template>
    <el-row>
      <el-col :span="24">
        <el-text type="info">{{ $t("company") }}</el-text>
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
const dialogStore = useDialog();
const open = ref<boolean>(false);
const emit = defineEmits(["closeDropdown"]);

const handleClick = () => {
  emit("closeDropdown");
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
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}
:deep(.el-text.el-text--info) {
  width: 44px;
  display: inline-block;
}
</style>
