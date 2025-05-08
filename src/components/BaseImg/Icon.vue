<template>
  <svg
    v-if="isSvg"
    :class="['inline-svg-wrapper', props.iconName]"
    v-bind="svgAttributes"
    v-html="iconSvgContent"
  ></svg>
  <img v-else :src="iconSrc" />
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import { computed, onMounted, ref, watch } from "vue";

const themeStore = useTheme();

interface Props {
  catalog?: string;
  iconName?: string;
  imgSuffix?: string;
  clearColor?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
});

const iconSvgContent = ref("");
const svgAttributes = ref<Record<string, string>>();

const isSvg = computed(() => props.imgSuffix === "svg");

const iconSrc = computed(() => {
  const theme = themeStore.systemTheme;
  // 使用新的路径格式
  return new URL(
    `../../assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`,
    import.meta.url
  ).href;
});
const setIconSvgContent = async () => {
  const path = iconSrc.value;
  try {
    const iconCache = themeStore.getIconCache(path);
    if (iconCache) {
      iconSvgContent.value = iconCache.content;
      svgAttributes.value = iconCache.attributes;
      return;
    }
    const response = await fetch(path);
    let svgText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");
    const svgElement = doc.documentElement;

    if (props.clearColor) {
      const elements = svgElement.querySelectorAll("*");
      elements.forEach((el) => {
        if (el.hasAttribute("fill")) {
          el.setAttribute("fill", "currentColor");
        }
        if (el.hasAttribute("stroke")) {
          el.setAttribute("stroke", "currentColor");
        }
      });
    }

    svgAttributes.value = {
      viewBox: svgElement.getAttribute("viewBox") || "",
      width: svgElement.getAttribute("width") || "",
      height: svgElement.getAttribute("height") || "",
    };

    iconSvgContent.value = svgElement.innerHTML;

    themeStore.setIconCache({
      path,
      content: iconSvgContent.value,
      attributes: svgAttributes.value,
    });
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

<style lang="scss" scoped></style>
