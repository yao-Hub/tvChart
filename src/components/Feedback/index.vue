<template>
  <el-dialog
    v-if="dialogStore.feedbackVisible"
    v-model="dialogStore.feedbackVisible"
    width="486"
    :zIndex="dialogStore.zIndex"
    @close="onClose"
    append-to-body
    destroy-on-close
  >
    <template #header>
      <span class="header">{{ t("feedback") }}</span>
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
      :class="{ hideUpload: fileList.length >= fileLimit }"
      ref="uploadRef"
      style="margin-top: 8px"
      v-model:file-list="fileList"
      :action="action"
      list-type="picture-card"
      accept="image/*"
      multiple
      :limit="fileLimit"
      :disabled="loading"
      :before-remove="beforeRemove"
      :on-success="onSuccess"
      :on-error="onError"
      :on-exceed="onExceed"
      :auto-upload="false"
    >
      <div>
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
            {{ t("delete") }}
          </span>
        </div>
      </template>
    </el-upload>

    <template #footer>
      <el-button @click="openMyfeedback">{{ t("myFeedback") }}</el-button>
      <el-button type="primary" @click="handleOk" :loading="loading">{{
        t("submit")
      }}</el-button>
    </template>
  </el-dialog>

  <MyFeedBack v-model:open="myFeedBackOpen"></MyFeedBack>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import type {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadUserFile,
} from "element-plus";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const dialogStore = useDialog();
const { t } = useI18n();

const fileLimit = 6;

interface CustomUploadUserFile extends UploadUserFile {
  response: {
    data: {
      fileId: string;
    };
  };
}

const onClose = () => {
  remark.value = "";
  fileList.value = [];
};

const remark = ref<string>("");
const fileList = ref<CustomUploadUserFile[]>([]);
const uploadRef = ref<UploadInstance>();
const loading = ref(false);
const action = computed(() => {
  return import.meta.env.VITE_HTTP_URL_admin + "/common/sysFile/upload";
});
const handleRemove = (file: UploadFile) => {
  if (loading.value) {
    return;
  }
  uploadRef.value!.handleRemove(file);
};

import { saveFeedback } from "@/api/feedback";
import { useNetwork } from "@/store/modules/network";
import dayjs from "dayjs";
import { ElMessage } from "element-plus";
import MyFeedBack from "./MyFeedBack.vue";

interface IResUpload {
  data: {
    fileId: string;
  };
}

const networkStore = useNetwork();
const myFeedBackOpen = ref(false);
const submit = async (feedbackFileIds: string[] = []) => {
  try {
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
    loading.value = false;
    onClose();
    dialogStore.closeDialog("feedbackVisible");
  } catch (error) {
    loading.value = false;
  }
};
const handleOk = async () => {
  loading.value = true;
  if (fileList.value.length) {
    // 是否存在还没有上传的文件
    const ifNoUpload = fileList.value.some((item) => !item.response);
    if (ifNoUpload) {
      uploadRef.value?.submit();
      return;
    }
    const feedbackFileIds = fileList.value.map(
      (item) => (item.response as IResUpload).data.fileId
    );
    submit(feedbackFileIds);
    return;
  }
  submit();
};
const onSuccess = (
  response: any,
  uploadFile: UploadFile,
  uploadFiles: UploadFiles
) => {
  const feedbackFileIds = uploadFiles.map(
    (item) => (item.response as IResUpload).data.fileId
  );
  submit(feedbackFileIds);
};
const onError = (error: Error) => {
  loading.value = false;
  ElMessage({
    message: t("tip.upLoadFileError"),
    type: "error",
  });
};
const beforeRemove = () => {
  return !loading.value;
};
const openMyfeedback = () => {
  dialogStore.incrementZIndex();
  myFeedBackOpen.value = true;
};
const onExceed = () => {
  ElMessage({
    message: t("tip.upLoadFileExceed", { num: fileLimit }),
    type: "warning",
  });
};
</script>

<style lang="scss">
.hideUpload .el-upload-list .el-upload--picture-card {
  display: none;
}
</style>
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
