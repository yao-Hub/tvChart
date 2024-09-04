<template>
  <div class="baseTabs">
    <slot></slot>
    <div class="baseTabs_add" v-if="props.addable">
      <PlusOutlined class="baseTabs_add_icon" @click="emit('handleAdd')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from '@ant-design/icons-vue';
import { provide } from 'vue';

const model = defineModel<string>("activeKey",{ required: true });
provide('model', model);

interface Props {
  addable?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  addable: false,
});
const emit = defineEmits(["handleAdd"]);
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.baseTabs {
  height: 24px;
  box-sizing: border-box;
  border-bottom: 1px solid;
  display: flex;
  font-size: 12px;
  @include border_color("border");
  @include background_color("background-component");
  &_add {
    width: 24px;
    height: 24px;
    border: 1px solid;
    border-left: none;
    @include border_color("border");
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .baseTabs_add_icon:hover {
    @include font_color("primary");
    cursor: pointer;
  }
}
</style>