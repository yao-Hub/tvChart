<template>
  <div
    class="baseTabs_item"
    :class="{ baseTabs_active: active }"
    @click="tabClick"
  >
    <slot name="tab">
      <span>{{ props.tab || "" }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { Ref, computed, inject, ref } from "vue";

const model = inject<Ref<string>>("model", ref(""));

interface Props {
  tab?: string;
  value: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
});
const emit = defineEmits(["tabClick"]);

const active = computed(() => {
  return model.value === props.value || model.value === props.tab;
});
const tabClick = () => {
  model.value = props.value;
  emit("tabClick", props.value || props.tab);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.baseTabs_item {
  height: 100%;
  font-weight: 500;
  min-width: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: 1px solid;
  border-bottom: none;
  padding: 0 8px;
  @include border_color("border");
  cursor: pointer;
  &:hover {
    @include background_color("tabHover");
    @include font_color("tabHoverTextColor");
  }
}
.baseTabs_active {
  @include background_color("tabActive");
  border: none;
  font-weight: 500;
}
</style>
