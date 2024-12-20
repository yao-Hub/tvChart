<template>
  <img :src="iconSrc" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "@/store/modules/theme";

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
