<template>
  <img :src="iconSrc" />
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
    const theme = themeStore.systemTheme;
    // const result = `/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`;
    const path = `/src/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`;
    const result = new URL(path, import.meta.url).href;
    console.log(path, result);
    return result;
  }
  return "";
});
</script>

<style lang="scss" scoped></style>
