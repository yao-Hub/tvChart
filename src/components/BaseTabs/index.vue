<template>
  <div class="baseTabs">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { provide } from "vue";

const model = defineModel<string>("activeKey", { required: true });
provide("model", model);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.baseTabs {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  gap: 4px;
  @include background_color("background");
}
</style>
