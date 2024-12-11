<template>
  <el-dialog
    v-model="dialogStore.feedbackVisible"
    width="486"
    :zIndex="10"
    destroy-on-close
    append-to-body
  >
    <template #header>
      <span class="header">{{ $t("feedback") }}</span>
    </template>

    <el-input
      v-model="remark"
      type="textarea"
      :rows="5"
      :placeholder="t('tip.feedbackPlac')"
      show-word-limit
      maxlength="500"
      style="margin-top: 24px"
    />

    <el-upload
      ref="uploadRef"
      style="margin-top: 8px"
      v-model:file-list="fileList"
      :action="action"
      list-type="picture-card"
    >
      <div class="uploadPlus">
        <el-icon><Plus /></el-icon>
      </div>
      <template #file="{ file }">
        <div class="uploadList">
          <el-image
            class="uploadList_img"
            :src="file.url"
            :zoom-rate="1.2"
            fit="cover"
            :preview-src-list="[file.url as string]"
          />
          <span
            class="el-upload-list__item-actions"
            @click="handleRemove(file)"
          >
            {{ $t("delete") }}
          </span>
        </div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="myFeedBackOpen = true">{{
        $t("myFeedback")
      }}</el-button>
      <el-button type="primary" @click="handleOk">{{ $t("submit") }}</el-button>
    </template>
  </el-dialog>

  <MyFeedBack v-model:open="myFeedBackOpen"></MyFeedBack>
</template>

<script setup lang="ts">
import type { UploadFile, UploadInstance, UploadUserFile } from "element-plus";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDialog } from "@/store/modules/dialog";

const { t } = useI18n();
const dialogStore = useDialog();

interface CustomUploadUserFile extends UploadUserFile {
  response: {
    data: {
      fileId: string;
    };
  };
}

const remark = ref<string>("");
const fileList = ref<CustomUploadUserFile[]>([]);
const uploadRef = ref<UploadInstance>();
const action = computed(() => {
  return import.meta.env.VITE_HTTP_URL_admin + "/common/sysFile/upload";
});
const handleRemove = (file: UploadFile) => {
  uploadRef.value!.handleRemove(file);
};
watch(
  () => dialogStore.feedbackVisible,
  (val) => {
    if (val) {
      remark.value = "";
      fileList.value = [];
    }
  }
);

import MyFeedBack from "./MyFeedBack.vue";
const myFeedBackOpen = ref(false);

import { saveFeedback } from "@/api/feedback";
import { useNetwork } from "@/store/modules/network";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
const networkStore = useNetwork();
const handleOk = async () => {
  const feedbackFileIds = fileList.value?.map(
    (item) => item.response.data.fileId
  );
  const updata = {
    platform: "web",
    brokerName: networkStore.currentLine!.brokerName,
    lineName: networkStore.currentLine!.lineName,
    feedbackContent: remark.value,
    feedbackFileIds,
    createTime: dayjs().unix(),
  };
  const res = await saveFeedback(updata);
  ElMessage({
    message: res.errmsg,
    type: "success",
  });
  dialogStore.feedbackVisible = false;
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}
:deep(.el-upload-list__item) {
  width: 56px;
  height: 56px;
}
:deep(.el-upload--picture-card) {
  width: 56px;
  height: 56px;
}
:deep(.el-upload-list__item-actions) {
  bottom: 0;
  height: 25px;
  top: unset;
  font-size: 14px;
  cursor: pointer;
}

.uploadList {
  position: relative;
  &_img {
    width: 100%;
    height: 100%;
  }
  &_delete {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 56px;
    height: 25px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 0px 0px 4px 4px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
