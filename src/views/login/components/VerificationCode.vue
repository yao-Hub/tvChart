<template>
  <el-input v-model="model" placeholder="verification code">
    <template #suffix>
      <span class="sendbtn">{{ $t("account.sendCode") }}</span>
      <span>xx秒后可重新获取</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
const model = defineModel<string>("value", { required: true });
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.sendbtn {
  @include font_color("word-gray");
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>
