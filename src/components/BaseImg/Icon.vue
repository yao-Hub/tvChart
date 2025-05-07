<template>
  <i
    :class="['inline-svg-wrapper', props.iconName]"
    :style="{ color: inheritColor }"
    v-html="iconSvgContent"
  ></i>
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
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
});

const inheritColor = computed(() => props.color || "currentColor");
const iconSvgContent = ref("");

const setIconSvgContent = async () => {
  const theme = props.theme || themeStore.systemTheme;

  const path = new URL(
    `/src/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`,
    import.meta.url
  ).href;
  try {
    const iconCache = themeStore.getIconCache(path);
    if (iconCache) {
      iconSvgContent.value = iconCache;
      return;
    }
    const response = await fetch(path);
    iconSvgContent.value = await response.text();
    themeStore.setIconCache({ path, content: iconSvgContent.value });
  } catch (e) {
    console.error("Failed to load SVG:", e);
  }
};

watch(
  () => [themeStore.systemTheme, props.theme],
  () => setIconSvgContent()
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
