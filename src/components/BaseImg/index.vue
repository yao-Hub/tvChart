<template>
  <component :is="comMap[type]" v-bind="props"></component>
</template>

<script setup lang="ts">
import { markRaw } from "vue";
import Icon from "./Icon.vue";
import Image from "./Image.vue";

interface Props {
  type?: "local" | "online";
}

const comMap = {
  local: markRaw(Icon),
  online: markRaw(Image),
};

const props = withDefaults(defineProps<Props>(), {
  type: "local",
});
</script>
