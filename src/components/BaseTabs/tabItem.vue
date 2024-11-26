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
import { inject, Ref, ref, computed } from "vue";

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
    background: #eff0f1;
    @include font_color("primary");
  }
}
.baseTabs_active {
  @include background_color("tabActive");
  border: none;
}
</style>
