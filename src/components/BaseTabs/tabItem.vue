<template>
  <div
    :class="[active ? 'baseTabs_item baseTabs_active' : 'baseTabs_item']"
    @click="tabClick"
  >
    <slot name="tab">
      <span>{{ props.tab || "" }}</span>
    </slot>
    <el-icon v-show="props.closable" @click="handleDelete" class="close"
      ><Close
    /></el-icon>
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
const emit = defineEmits(["tabClick", "itemDel"]);

const active = computed(() => {
  return model.value === props.value || model.value === props.tab;
});
const tabClick = () => {
  model.value = props.value;
  emit("tabClick", props.value || props.tab);
};
const handleDelete = () => {
  emit("itemDel", props.value || props.tab);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
.baseTabs_item {
  font-size: var(--font-size);
  height: 24px;
  min-width: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-bottom: 1px solid;
  border-right: 1px solid;
  padding: 0 8px;
  @include border_color("border");
  cursor: pointer;
  &:hover {
    background: #eff0f1;
    @include font_color("primary");
  }
}
.close {
  margin-left: 6px;
  cursor: pointer;
}
.baseTabs_active {
  border-bottom: 2px solid;
  @include background_color("tabActive");
  @include border_color_bottom("primary");
}
</style>
