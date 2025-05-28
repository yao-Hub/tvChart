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

const getCache = () => {
  const iconCache = themeStore.getIconCache(iconSrc.value);
  if (iconCache) {
    iconSvgContent.value = iconCache.content;
    svgAttributes.value = iconCache.attributes;
    if (props.clearColor) {
      clearColor();
    }
    return true;
  }
  return false;
};

const setIconSvgContent = async () => {
  const path = iconSrc.value;
  const cacheKey = `${path}`; // 组合唯一键

  // 尝试获取缓存
  const ifCache = getCache();
  if (ifCache) return;

  // 检查是否有进行中的请求
  if (themeStore.svgPendingRequests[cacheKey]) {
    await themeStore.svgPendingRequests[cacheKey];
    // 请求完成后再次检查缓存
    const ifCache = getCache();
    if (ifCache) return;
    return;
  }

  // 创建新请求
  try {
    const requestPromise = (async () => {
      const response = await fetch(path);
      let svgText = await response.text();
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

      themeStore.setIconCache({
        path,
        content: svgElement.innerHTML,
        attributes,
        clearColor: props.clearColor,
      });

      svgAttributes.value = attributes;
      iconSvgContent.value = svgElement.innerHTML;

      if (props.clearColor) {
        clearColor();
      }
    })();

    // 存储 Promise 并等待完成
    themeStore.svgPendingRequests[cacheKey] = requestPromise;
    await requestPromise;
  } catch (e) {
    console.error("Failed to load SVG:", e);
  } finally {
    // 清理已完成请求
    delete themeStore.svgPendingRequests[cacheKey];
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
