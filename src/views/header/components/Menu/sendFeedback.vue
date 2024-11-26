<template>
  <div class="item" @click="dialogStore.feedbackVisible = true">
    <img class="logo" src="@/assets/icons/icon_15.svg" />
    <span>{{ $t("feedback") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();
</script>
<style lang="scss" scoped>
.item {
  display: flex;
  gap: 5px;
  height: 32px;
  align-items: center;
}
</style>
