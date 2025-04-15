<template>
  <el-dialog
    v-if="dialogStore.updateVersionVisible"
    v-model="dialogStore.updateVersionVisible"
    width="450"
    :zIndex="998"
    destroy-on-close
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    align-center
  >
    <component :is="stausMap[status]" />
  </el-dialog>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();

import { useVersion } from "@/store/modules/version";
import { markRaw, computed } from "vue";
import type { Component } from "vue";

import Force from "./force.vue";
import Latest from "./latest.vue";
import Normal from "./normal.vue";

const stausMap: Record<number, Component> = {
  0: markRaw(Latest),
  1: markRaw(Normal),
  2: markRaw(Force),
};

const status = computed(() => {
  const info = useVersion().versionInfo;
  if (info) {
    return info.updateType;
  }
  return 0;
});
</script>

<style lang="scss" scoped></style>
