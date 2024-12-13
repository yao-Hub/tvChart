<template>
  <div class="sendFeedback" @click="handleClick">
    <BaseImg class="logo" iconName="icon_15" />
    <span>{{ $t("feedback") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
const dialogStore = useDialog();

const emit = defineEmits(["closeDropdown"]);
const handleClick = () => {
  emit("closeDropdown");
  dialogStore.feedbackVisible = true;
};
</script>
<style lang="scss" scoped>
.sendFeedback {
  height: 100%;
  width: 100%;
  display: flex;
  gap: 5px;
  align-items: center;
}
</style>
