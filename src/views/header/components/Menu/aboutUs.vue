<template>
  <div class="item" @click="open = true">
    <TeamOutlined />
    <span>{{ $t("aboutUs") }}</span>
  </div>

  <el-dialog
    v-model="open"
    width="486"
    :zIndex="10"
    destroy-on-close
    append-to-body
  >
    <template #header>
      <span class="header">{{ $t("aboutUs") }}</span>
    </template>
    <el-row>
      <el-col :span="24">
        <span class="label">{{ $t("company") }}：</span>
        <span class="value">广州微派</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <span class="label">Tel：</span>
        <span class="value">+86 8803 445</span>
      </el-col>
      <el-col :span="12">
        <span class="label">FaX：</span>
        <span class="value">+86 8803 445</span>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="12">
        <span class="label">Web：</span>
        <span class="value">www.weipai.com</span>
      </el-col>
      <el-col :span="12">
        <span class="label">Email：</span>
        <span class="value">info@utrader.com</span>
      </el-col>
    </el-row>
  </el-dialog>
</template>

<script setup lang="ts">
import { TeamOutlined } from "@ant-design/icons-vue";
import { ref } from "vue";
const open = ref<boolean>(false);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.item {
  display: flex;
  gap: 5px;
  height: 32px;
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
.label {
  @include font_color("word-gray");
  font-weight: 400;
  font-size: var(--font-size);
}
.value {
  @include font_color("word");
  font-weight: 400;
  font-size: var(--font-size);
}
</style>
