<template>
  <div class="scrolling">
    <el-button
      class="btn"
      :icon="ArrowLeft"
      v-if="showScrollLeft"
      @click.stop="scrollLeft"
    />
    <div class="scrolling_container" ref="container">
      <slot></slot>
    </div>
    <el-button
      class="btn"
      :icon="ArrowRight"
      v-if="showScrollRight"
      @click.stop="scrollRight"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import { sleep } from "utils/common/index";

const container = ref();
const updateScrollButtons = () => {
  setTimeout(() => {
    const tabs = container.value;
    if (tabs) {
      showScrollLeft.value = tabs.scrollLeft > 0;
      showScrollRight.value =
        tabs.scrollLeft < tabs.scrollWidth - tabs.clientWidth;
    }
  }, 200);
};

const scrollLeft = () => {
  const tabs = container.value;
  const newScroll = Math.max(0, tabs.scrollLeft - 200);
  tabs.scrollLeft = newScroll;
  updateScrollButtons();
};
const scrollRight = () => {
  const tabs = container.value;
  const maxScroll = tabs.scrollWidth - tabs.clientWidth;
  const newScroll = Math.min(maxScroll, tabs.scrollLeft + 200);
  tabs.scrollLeft = newScroll;
  updateScrollButtons();
};

const showScrollLeft = ref(false);
const showScrollRight = ref(false);

function tabsMouseWheel(event: WheelEvent) {
  event.preventDefault();
  // 向上滚动，向左移动div
  if (event.deltaY < 0) {
    scrollLeft();
  } else {
    scrollRight();
  }
}
onMounted(async () => {
  updateScrollButtons();
  window.addEventListener("resize", updateScrollButtons);
  container.value.addEventListener("wheel", tabsMouseWheel);
  await sleep(500);
  const resizeObserver = new ResizeObserver(() => updateScrollButtons());
  resizeObserver.observe(container.value);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateScrollButtons);
  if (container.value) {
    container.value.removeEventListener("wheel", tabsMouseWheel);
  }
});

onUpdated(() => {
  updateScrollButtons();
});
</script>

<style lang="scss" scoped>
.scrolling {
  display: flex;
  align-items: center;
  overflow: hidden;
  justify-content: space-between;
  gap: 4px;
}
.scrolling_container {
  overflow-x: auto;
  flex-wrap: nowrap;
  flex: 1;
  scroll-behavior: smooth;
  align-self: center;
  &::-webkit-scrollbar {
    width: 0;
    display: none;
  }
}
.btn {
  padding: 0;
  box-sizing: border-box;
  height: var(--component-size);
}
</style>
