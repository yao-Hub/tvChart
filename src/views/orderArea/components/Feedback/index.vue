<template>
  <div class="item" @click="showModal">
    <MailOutlined />
    <span>{{ $t("feedback") }}</span>
  </div>

  <a-modal v-model:open="open" :title="$t('feedback')">
    <a-textarea
      v-model:value="remark"
      :placeholder="$t('feedback')"
      :auto-size="{ minRows: 5, maxRows: 5 }"
      show-count
      :maxlength="500"
    />

    <a-upload
      v-model:file-list="fileList"
      :action="action"
      list-type="picture-card"
      @preview="handlePreview"
    >
      <div v-if="fileList && fileList.length < 8">
        <plus-outlined />
        <div style="margin-top: 8px">{{ $t("upload") }}</div>
      </div>
    </a-upload>

    <template #footer>
      <a-button @click="myFeedBackOpen = true">我的反馈</a-button>
      <a-button type="primary" @click="handleOk">提交</a-button>
    </template>
  </a-modal>

  <a-modal
    :open="previewVisible"
    :title="previewTitle"
    :footer="null"
    @cancel="handleCancel"
  >
    <img alt="example" style="width: 100%" :src="previewImage" />
  </a-modal>

  <MyFeedBack v-model:open="myFeedBackOpen"></MyFeedBack>
</template>

<script setup lang="ts">
import { MailOutlined } from "@ant-design/icons-vue";
import { ref, computed } from "vue";
const open = ref<boolean>(false);
const remark = ref<string>("");
const showModal = () => {
  open.value = true;
};

import { PlusOutlined } from "@ant-design/icons-vue";
function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

const previewVisible = ref(false);
const previewImage = ref("");
const previewTitle = ref("");
const handleCancel = () => {
  previewVisible.value = false;
  previewTitle.value = "";
};
const handlePreview = async (file: any) => {
  if (!file.url && !file.preview) {
    file.preview = (await getBase64(file.originFileObj)) as string;
  }
  previewImage.value = file.url || file.preview;
  previewVisible.value = true;
  previewTitle.value =
    file.name || file.url.substring(file.url.lastIndexOf("/") + 1);
};

import MyFeedBack from "./MyFeedBack.vue";
const myFeedBackOpen = ref(false);

import type { UploadProps, UploadFile } from "ant-design-vue";
const fileList = ref<UploadProps["fileList"]>([]);
const action = computed(() => {
  // return import.meta.env.VITE_HTTP_URL_admin;
  return "http://192.168.0.198:8666/common/sysFile/upload"
});
import { saveFeedback } from "api/feedback";
import { useNetwork } from "@/store/modules/network";
const networkStore = useNetwork();
const handleOk = async () => {
  const feedbackFileIds = fileList.value?.map((item: UploadFile) => item.response.data.fileId) as string[];
  const updata = {
    platform: "web",
    brokerName: networkStore.currentLine!.brokerName,
    lineName: networkStore.currentLine!.lineName,
    remark: remark.value,
    feedbackFileIds,
  };
  await saveFeedback(updata);
  open.value = false;
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.item {
  display: flex;
  gap: 5px;
  font-size: 12px;
  @include font_color("word-gray");
  cursor: pointer;
  min-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-content: flex-end;
}
.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
