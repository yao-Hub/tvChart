<template>
  <el-dialog
    v-if="dialogStore.visibles.feedbackVisible"
    v-model="dialogStore.visibles.feedbackVisible"
    width="486"
    :zIndex="dialogStore.zIndex"
    @close="onClose"
    append-to-body
    destroy-on-close
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{ t("feedback") }}</span>
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
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
      list-type="picture-card"
      accept="image/*"
      multiple
      :limit="fileLimit"
      :disabled="loading"
      :on-exceed="onExceed"
      :auto-upload="false"
      :on-change="onChange"
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
            v-if="!loading"
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
import { ref } from "vue";
import type {
  UploadFile,
  UploadFiles,
  UploadInstance,
  UploadUserFile,
} from "element-plus";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import { useI18n } from "vue-i18n";

import { useDialog } from "@/store/modules/dialog";
import { useNetwork } from "@/store/modules/network";

import { saveFeedback, uploadFile } from "@/api/feedback";

import MyFeedBack from "./MyFeedBack.vue";

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

const handleRemove = (file: UploadFile) => {
  if (loading.value) {
    return;
  }
  uploadRef.value!.handleRemove(file);
};

const networkStore = useNetwork();
const myFeedBackOpen = ref(false);
const submitFeedback = async (feedbackFileIds: string[] = []) => {
  try {
    const updata = {
      platform: "web",
      brokerName: networkStore.currentLine!.brokerName,
      lineName: networkStore.currentLine!.lineName,
      feedbackContent: remark.value,
      feedbackFileIds,
      createTime: dayjs().unix(),
    };
    await saveFeedback(updata);
    ElMessage({
      message: t("tip.succeed", { type: t("submit") }),
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
  let feedbackFileIds: string[] = [];
  if (fileList.value.length) {
    const uploadList: File[] = [];
    fileList.value.forEach((item) => {
      if (item.raw) {
        uploadList.push(item.raw);
      }
    });
    const httpList = uploadList.map((file) => uploadFile({ file, type: 1 }));
    const resList = await Promise.all(httpList);
    feedbackFileIds = resList.map((item) => item.data.fileId);
  }
  submitFeedback(feedbackFileIds);
  loading.value = false;
};

const limitSize = 10;
const onChange = (file: UploadFile, uploadFiles: UploadFiles) => {
  const { size, uid } = file;
  if (size && size > 1024 ** 2 * limitSize) {
    ElMessage.warning(t("tip.limitImageSize", { size: `${limitSize}M` }));
    const index = uploadFiles.findIndex((e) => e.uid === uid);
    if (index > -1) {
      uploadFiles.splice(index, 1);
    }
  }
};
const onExceed = () => {
  ElMessage({
    message: t("tip.upLoadFileExceed", { num: fileLimit }),
    type: "warning",
  });
};

const openMyfeedback = () => {
  dialogStore.incrementZIndex();
  myFeedBackOpen.value = true;
};
</script>

<style lang="scss">
.hideUpload .el-upload-list .el-upload--picture-card {
  display: none;
}
</style>
<style lang="scss" scoped>
@import "@/styles/_handle.scss";
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
