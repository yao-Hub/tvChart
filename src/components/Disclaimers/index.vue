<template>
  <component :is="comMap[type]" v-bind="props"></component>
</template>

<script setup lang="ts">
import { markRaw } from "vue";
import En from "./En.vue";
import ZHCN from "./Zh-Cn.vue";
import ZHTW from "./Zh-Tw.vue";

interface Props {
  type?: "zh" | "en" | "zhTw";
}

const comMap = {
  zh: markRaw(ZHCN),
  en: markRaw(En),
  zhTw: markRaw(ZHTW),
};

const props = withDefaults(defineProps<Props>(), {
  type: "zh",
});
</script>

<style lang="scss">
@import "@/styles/_handle.scss";
.header {
  font-weight: bold;
  font-size: var(--icon-size);
  @include border_color("border");
}
.disclaimers {
  border-radius: 5px;
  box-sizing: border-box;
  padding: 10px;
  margin: 15px 0;
  border: 1px solid;
  @include border_color("border");
  .section {
    margin: 15px 0;
    line-height: 24px;
    font-size: 14px;
    @include font_color("word");
  }
  .title {
    font-weight: 400;
    font-size: 18px;
    text-align: center;
    @include font_color("word");
  }
}
.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &_btnGroup {
    display: flex;
    gap: 5px;
  }
}
.btn {
  height: var(--base-height);
}
</style>
