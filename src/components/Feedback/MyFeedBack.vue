<template>
  <el-dialog
    v-if="model"
    v-model="model"
    width="486"
    :zIndex="dialogStore.zIndex"
    :show-close="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass">{{ t("myFeedback") }}</span>
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
    </template>
    <el-scrollbar v-loading="loading" class="commentList">
      <div
        class="commentItem"
        v-for="(item, index) in commentList"
        :key="index"
      >
        <el-text>{{ item.feedbackContent }}</el-text>
        <div class="images">
          <BaseImg
            v-for="(src, index) in item.feedbackFileIds"
            style="width: 56px; height: 56px"
            type="online"
            :src="src"
            :zoom-rate="1.2"
            :max-scale="7"
            :min-scale="0.2"
            :preview-src-list="item.feedbackFileIds"
            :initial-index="index"
            fit="cover"
            loading="lazy"
          >
          </BaseImg>
        </div>
        <div class="time">
          <el-text type="info">{{ formatTime(item.createTime) }}</el-text>
          <el-text
            class="expand"
            type="primary"
            v-if="item.feedbackReply"
            @click="item.ifExpand = !item.ifExpand"
          >
            {{ item.ifExpand ? t("retract") : t("expandReply") }}
          </el-text>
        </div>

        <div class="reply" v-show="item.ifExpand && item.feedbackReply">
          <div class="title">
            <el-text>{{ t("platformReply") }}</el-text>
            <el-text type="info">{{ formatTime(item.replyTime) }}</el-text>
          </div>
          <el-text>{{ item.feedbackReply }}</el-text>
        </div>
      </div>
      <el-empty v-if="commentList.length === 0" />
    </el-scrollbar>
  </el-dialog>
</template>

<script setup lang="ts">
import { useDialog } from "@/store/modules/dialog";
import { ref, watch } from "vue";

import { useI18n } from "vue-i18n";
const { t } = useI18n();

const dialogStore = useDialog();

const model = defineModel("open", { type: Boolean, default: false });

import { myfeedback, resFeedback } from "api/feedback";
type commentList = resFeedback & {
  avatar: string;
  ifExpand: boolean;
};
const commentList = ref<Array<commentList>>([]);
const loading = ref(false);
watch(
  () => model.value,
  async (val) => {
    if (val) {
      loading.value = true;
      const res = await myfeedback();
      loading.value = false;
      commentList.value = res.data.map((item) => {
        return {
          ...item,
          avatar: "",
          ifExpand: true,
        };
      });
    }
  }
);

import { useTime } from "@/store/modules/time";
import dayjs from "dayjs";
const formatTime = (time: number) => {
  const timeStore = useTime();
  const timezone = timeStore.settedTimezone;
  return dayjs(time).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-text) {
  align-self: flex-start;
  word-break: break-all;
  line-height: 20px;
}
.grayWord {
  @include font_color("word-gray");
}
.commentList {
  height: 500px;
  margin-top: 24px;
}
.commentItem {
  width: 100%;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 23px;
  padding-bottom: 24px;
  border-bottom: 1px solid;
  @include border_color("border");

  .images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .time {
    display: flex;
    justify-content: space-between;
    .expand {
      -moz-user-select: none;
      -o-user-select: none;
      -khtml-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  }
  .reply {
    width: 100%;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    @include background_color("background-component");
    .title {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
