<template>
  <div class="expandIcon">
    <div class="expandIcon_left">
      <TranslationOutlined />
      <span>语言</span>
    </div>
    <div class="expandIcon_right">
      <span>English</span>
      <RightOutlined style="font-size: 12px"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RightOutlined, TranslationOutlined } from '@ant-design/icons-vue';
</script>

<style lang="scss" scoped>
.expandIcon {
  display: flex;
  justify-content: space-between;
  margin-inline-end: -17px;
  &_left {
    display: flex;
    gap: 5px;
  }
  &_right {
    display: flex;
    gap: 5px;
  }
}
</style>