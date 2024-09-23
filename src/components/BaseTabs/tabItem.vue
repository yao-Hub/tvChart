<template>
  <div
    :class="[
      model === props.activeKey || model === props.tab
        ? 'baseTabs_item baseTabs_active'
        : 'baseTabs_item'
    ]"
  >
    <span class="tab" @click="tabClick">
      <slot name="tab">
        {{ props.tab || "" }}
      </slot>
    </span>
    <CloseOutlined class="close" v-show="props.closable" @click="handleDelete" />
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined } from "@ant-design/icons-vue";
import { inject, Ref, ref } from "vue";

const model = inject<Ref<string>>("model", ref(""));

interface Props {
  tab?: string;
  activeKey: string;
  closable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
});
const emit = defineEmits(["tabClick", "itemDel"]);

const tabClick = () => {
  model.value = props.activeKey;
  emit("tabClick", model.value);
};
const handleDelete = () => {
  emit("itemDel", model.value);
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";
.baseTabs_item {
  height: 100%;
  min-width: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-right: 1px solid;
  @include border_color("border");
  padding: 0 8px;
}
.close {
  width: 8px;
  height: 8px;
  margin-left: 6px;
  margin-top: 1px;
  @include font_color("closeBtn");
  cursor: pointer;
}
.baseTabs_active {
  @include background_color("tabActive");
  border-bottom: 2px solid;
  @include border_color_bottom("primary");
}
.tab:hover {
  @include font_color("primary");
  cursor: pointer;
}
</style>
