<template>
  <i
    v-if="isSvg"
    :class="['inline-svg-wrapper', props.iconName]"
    :style="{ color: inheritColor }"
    v-html="iconSvgContent"
  ></i>
  <img
    v-else
    :src="iconSrc"
    :alt="props.iconName"
    :style="{ color: inheritColor }"
  />
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import { computed, onMounted, ref, watch } from "vue";

const themeStore = useTheme();

interface Props {
  catalog?: string;
  iconName?: string;
  imgSuffix?: string;
  theme?: "light" | "dark";
  color?: string;
  customColor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
});

const inheritColor = computed(() => props.color || "currentColor");
const iconSvgContent = ref("");

const isSvg = computed(() => props.imgSuffix === "svg");

const iconSrc = computed(() => {
  const theme = props.theme || themeStore.systemTheme;
  return `/src/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`;
});
const setIconSvgContent = async () => {
  const path = new URL(iconSrc.value, import.meta.url).href;
  try {
    const iconCache = themeStore.getIconCache(path);
    if (iconCache) {
      iconSvgContent.value = iconCache;
      return;
    }
    const response = await fetch(path);
    let svgText = await response.text();
    if (props.color || props.customColor) {
      svgText = svgText
        .replace(/fill="[^"]*"/g, "")
        .replace(/stroke="[^"]*"/g, "");
    }
    iconSvgContent.value = svgText;
    themeStore.setIconCache({ path, content: iconSvgContent.value });
  } catch (e) {
    console.error("Failed to load SVG:", e);
  }
};

watch(
  () => [themeStore.systemTheme, props],
  () => setIconSvgContent(),
  { deep: true }
);

onMounted(() => setIconSvgContent());
</script>

<style lang="scss">
.inline-svg-wrapper {
  display: inline-block;
  vertical-align: middle;

  svg {
    fill: currentColor;
    stroke: currentColor;
  }
}
</style>
