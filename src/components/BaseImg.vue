<template>
  <img :src="source" v-bind="option" />
</template>

<script setup lang="ts">
import { useTheme } from "@/store/modules/theme";
import { computed } from "vue";

const themeStore = useTheme();

interface Props {
  catalog?: string;
  iconName?: string;
  option?: object;
  imgSuffix?: string;
  fullPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  catalog: "icons",
  imgSuffix: "svg",
});

const source = computed(() => {
  if (props.fullPath) {
    return props.fullPath;
  }
  if (props.iconName) {
    const theme = themeStore.systemTheme;
    // return `/static/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`;
    return new URL(
      `/src/assets/${props.catalog}/${theme}/${props.iconName}.${props.imgSuffix}`,
      import.meta.url
    ).href;
  }
  return "";
});
</script>

<style lang="scss" scoped></style>
