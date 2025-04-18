<template>
  <img :src="iconSrc" :class="[props.iconName]" />
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import { computed } from "vue";

const themeStore = useTheme();

interface Props {
  catalog?: string;
  iconName?: string;
  imgSuffix?: string;
  fullPath?: string;
  theme?: "light" | "dark";
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
});

const iconSrc = computed(() => {
  if (props.fullPath) {
    return props.fullPath;
  }
  if (props.iconName) {
    const theme = props.theme || themeStore.systemTheme;
    // const result = `/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`;
    const result = new URL(
      `/src/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`,
      import.meta.url
    ).href;
    return result;
  }
  return "";
});
</script>

<style lang="scss" scoped></style>
