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
  noTheme?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
  clearColor: false,
});

const iconSvgContent = ref("");
const svgAttributes = ref<Record<string, string>>({
  viewBox: "0 0 0 0",
  width: "0",
  height: "0",
});

const isSvg = computed(() => props.imgSuffix === "svg");

const iconSrc = computed(() => {
  const theme = themeStore.systemTheme;
  const themePath = props.noTheme ? "" : `${theme}/`;
  // 使用新的路径格式
  return new URL(
    `../../assets/${props.catalog}/${themePath}${props.iconName}.${props.imgSuffix}`,
    import.meta.url
  ).href;
});

const clearColor = () => {
  const doc = new DOMParser().parseFromString(
    iconSvgContent.value,
    "image/svg+xml"
  );
  doc.querySelectorAll("*").forEach((el) => {
    el.hasAttribute("fill") && el.setAttribute("fill", "currentColor");
    el.hasAttribute("stroke") && el.setAttribute("stroke", "currentColor");
  });
  iconSvgContent.value = doc.documentElement.innerHTML;
};

const svgModules = import.meta.glob("@/assets/**/*.svg", {
  as: "raw",
  eager: false, // 启用按需加载
});

const setIconSvgContent = async () => {
  if (!isSvg.value) return;
  try {
    const theme = themeStore.systemTheme;
    const themePath = props.noTheme ? "" : `${theme}/`;
    const buildTimePath = `/src/assets/${props.catalog}/${themePath}${props.iconName}.${props.imgSuffix}`;
    // 动态导入
    const svgText = await svgModules[buildTimePath]();
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, "image/svg+xml");

    const titles = doc.querySelectorAll("title");
    titles.forEach((title) => title.remove());

    const svgElement = doc.documentElement;

    const attributes = {
      viewBox: svgElement.getAttribute("viewBox") || "",
      width: svgElement.getAttribute("width") || "",
      height: svgElement.getAttribute("height") || "",
    };

    svgAttributes.value = attributes;
    iconSvgContent.value = svgElement.innerHTML;

    if (props.clearColor) {
      clearColor();
    }
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
