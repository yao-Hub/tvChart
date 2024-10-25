<template>
  <div class="baseTabs">
    <slot></slot>
    <div class="opera">
      <div class="add" v-if="props.addable">
        <PlusOutlined class="baseTabs_add_icon" @click="emit('handleAdd')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined } from "@ant-design/icons-vue";
import { provide } from "vue";

const model = defineModel<string>("activeKey", { required: true });
provide("model", model);

interface Props {
  addable?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  addable: false,
});
const emit = defineEmits(["handleAdd"]);
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.baseTabs {
  height: 24px;
  box-sizing: border-box;
  display: flex;
  @include background_color("background-component");
  .opera {
    flex: 1;
    border-bottom: 1px solid;
    @include border_color("border");
  }
  .add {
    width: 24px;
    box-sizing: border-box;
    height: 100%;
    border-right: 1px solid;
    display: flex;
    justify-content: center;
    align-items: center;
    @include border_color("border");
  }

  .baseTabs_add_icon:hover {
    @include font_color("primary");
    cursor: pointer;
  }
}
</style>
