<template>
  <div class="sendFeedback" @click="handleClick">
    <BaseImg class="logo" iconName="icon_15" />
    <span>{{ t("feedback") }}</span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useDialog } from "@/store/modules/dialog";
import eventBus from "utils/eventBus";

const { t } = useI18n();
const dialogStore = useDialog();

const handleClick = () => {
  eventBus.emit("closeDropdown");
  dialogStore.openDialog("feedbackVisible");
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
