<template>
  <div class="theme-segment">
    <div class="slider" :style="sliderStyle"></div>
    <div class="item" v-for="item in options" @click="handleChange">
      <BaseImg :iconName="item.icon"></BaseImg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import { computed, ref } from "vue";

const themeStore = useTheme();
const options = [
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
];

const nowTheme = computed(() => themeStore.systemTheme);

// 计算滑块位置
const sliderStyle = ref({});

const getSliderStyle = () => {
  const activeIndex = options.findIndex(
    (item) => item.value === nowTheme.value
  );
  sliderStyle.value = {
    transform: `translateX(${activeIndex * 100}%)`,
  };
};

getSliderStyle();
const handleChange = () => {
  themeStore.changeSystemTheme();

  setTimeout(() => getSliderStyle(), 0);
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.theme-segment {
  display: flex;
  position: relative;
  border: 1px solid;
  width: 64px;
  height: 22px;
  border-radius: 4px;
  @include border_color("border");
  .slider {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    height: 100%;
    width: 50%;
    transition: all 0.3s;
    pointer-events: none;
    @include background-color("border");
  }

  .item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }
}
</style>
