<template>
  <div class="scrolling">
    <el-button
      :icon="ArrowLeft"
      size="small"
      v-if="showScrollLeft"
      @click="scrollLeft"
    />
    <div class="scrolling_container" ref="container">
      <slot></slot>
    </div>
    <el-button
      :icon="ArrowRight"
      size="small"
      v-if="showScrollRight"
      @click="scrollRight"
    />
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";
import { ref, onMounted, onUpdated } from "vue";
import { debounce } from "lodash";

const container = ref();

function updateScrollButtons() {
  const tabs = container.value;
  // showScrollLeft.value = tabs.scrollLeft > 0;
  showScrollLeft.value = tabs.scrollWidth && tabs.scrollWidth > tabs.clientWidth;
  // showScrollRight.value = tabs.scrollLeft < tabs.scrollWidth - tabs.clientWidth;
  showScrollRight.value = tabs.scrollWidth && tabs.scrollWidth > tabs.clientWidth;
}

const scrollLeft = () => {
  const left = (container.value.scrollLeft -= 200);
  if (left < 0) {
    container.value.scrollLeft = left < 0 ? 0 : left;
  }
  updateScrollButtons();
};
const scrollRight = () => {
  const maxLeft = container.value.scrollWidth - container.value.offsetWidth;
  const left = (container.value.scrollLeft += 200);
  container.value.scrollLeft = left > maxLeft ? maxLeft : left;
  updateScrollButtons();
};

const showScrollLeft = ref(false);
const showScrollRight = ref(false);

function tabsMouseWheel(event: any) {
  event.preventDefault();
  // 向上滚动，向左移动div
  if (event.deltaY < 0) {
    scrollLeft();
  } else {
    scrollRight();
  }
}
onMounted(() => {
  updateScrollButtons();
  window.addEventListener("resize", updateScrollButtons);
  container.value.addEventListener("wheel", tabsMouseWheel);

  const resizeObserver = new ResizeObserver(debounce(() => {
    updateScrollButtons();
  }, 20));
  resizeObserver.observe(container.value);
});

onUpdated(() => {
  updateScrollButtons();
});
</script>

<style lang="scss" scoped>
.scrolling {
  display: flex;
  align-items: center;
  overflow: hidden; /* 隐藏溢出部分 */
  justify-content: space-between;
  gap: 2px;
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
</style>
