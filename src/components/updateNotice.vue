<template>
  <div class="notice" v-if="useDialog().updateNoticeVisible" ref="noticeRef">
    <div class="notice__group">
      <h2 class="notice__title" ref="headerRef">{{ title }}</h2>
      <div class="notice__content">
        <el-progress :percentage="progress" :status="status" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDraggable } from "@/hooks/use-draggable";

const { t } = useI18n();

const progress = ref(0);

const status = ref<"" | "success" | "warning" | "exception">("");
const title = ref(t("update.downloading"));

const noticeRef = ref();
const headerRef = ref();
const draggable = computed(() => true);

onMounted(() => {
  window.electronAPI?.on("download-progress", (progressData) => {
    if (progress.value > 99) {
      return;
    }
    progress.value = +progressData.progress;
    title.value = t("update.downloading");
  });
  window.electronAPI?.on("download-error", () => {
    title.value = t("update.downloadError");
    status.value = "exception";
  });
  window.electronAPI?.on("download-completed", () => {
    title.value = t("update.downloadCompleted");
    status.value = "success";
    progress.value = 100;
    setTimeout(() => useDialog().closeDialog("updateNoticeVisible"), 3000);
  });
});

useDraggable(noticeRef, headerRef, draggable);
</script>

<style lang="scss" scoped>
.notice {
  display: flex;
  width: 330px;
  padding: 14px 26px 14px 13px;
  border-radius: 8px;
  box-sizing: border-box;
  border: 1px solid var(--el-border-color-lighter);
  position: fixed;
  background-color: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  top: 16px;
  right: 16px;
  z-index: 9999;
}
.notice__group {
  flex: 1;
  margin-left: 13px;
  margin-right: 8px;
}
.notice__title {
  font-weight: 700;
  font-size: 16px;
  line-height: 24px;
  color: var(--el-text-color-primary);
  margin: 0;
  cursor: grab;
}
.notice__content {
  font-size: var(--el-font-size-base);
  line-height: 24px;
  margin: 6px 0 0;
  color: var(--el-text-color-regular);
}
</style>
