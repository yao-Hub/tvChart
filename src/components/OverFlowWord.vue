<template>
  <el-tooltip :content="content" placement="top" :disabled="tooltipDisabled">
    <div ref="textRef" class="contentWord" @mouseenter="checkOverflow">
      {{ content }}
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";

interface Props {
  content: string;
}

const props = defineProps<Props>();
const textRef = ref<HTMLElement | null>(null);
const tooltipDisabled = ref(true);

const checkOverflow = () => {
  if (textRef.value) {
    const { scrollWidth, clientWidth } = textRef.value;
    tooltipDisabled.value = scrollWidth <= clientWidth;
  }
};

onMounted(() => {
  nextTick(checkOverflow);
});

watch(
  () => props.content,
  () => nextTick(checkOverflow)
);
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
