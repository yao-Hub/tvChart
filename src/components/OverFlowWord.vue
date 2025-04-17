<template>
  <el-tooltip
    :content="renderContent"
    placement="top"
    :disabled="tooltipDisabled"
  >
    <div ref="textRef" class="contentWord" @mouseenter="checkOverflow">
      {{ renderContent }}
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface Props {
  content?: string | number;
}

const renderContent = computed(() => {
  if (typeof props.content === "number") {
    return props.content.toString();
  }
  return props.content;
});

const props = defineProps<Props>();
const textRef = ref<HTMLElement | null>(null);
const tooltipDisabled = ref(true);

const checkOverflow = () => {
  if (textRef.value) {
    const { scrollWidth, clientWidth } = textRef.value;
    tooltipDisabled.value = scrollWidth <= clientWidth;
  }
};
</script>

<style lang="scss" scoped>
.contentWord {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  width: 100%;
}
</style>
