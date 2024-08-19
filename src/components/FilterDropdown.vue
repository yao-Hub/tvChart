<template>
  <div>
    <a-dropdown  v-model:open="visible">
      <template #overlay>
        <slot name="overlay"></slot>
      </template>
      <div class="face">
        <span>{{ props.title }}</span>
        <CaretDownFilled />
      </div>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { CaretDownFilled } from "@ant-design/icons-vue";

interface Props {
  title?: string;
}

const props = defineProps<Props>();

const visible = ref(false);
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.face {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  min-width: 100px;
  gap: 4px;
  @include background_color("background-component");
  @include font_color("word");
  font-size: 12px;
  &:hover {
    @include font_color("primary");
  }
}
</style>
