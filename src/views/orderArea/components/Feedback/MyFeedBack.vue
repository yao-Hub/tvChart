<template>
  <el-dialog
    v-model="modal"
    width="486"
    :zIndex="11"
    destroy-on-close
    append-to-body
  >
    <template #header>
      <span class="header">我的反馈</span>
    </template>
    <el-scrollbar v-loading="loading" class="commentList">
      <div v-for="item in commentList">
        <div class="comment">
          <div class="avatar">
            <el-avatar :size="40" :src="item.avatar" />
          </div>
          <div class="detail">
            <span class="word">{{ item.remark }}</span>
            <div class="images">
              <el-image
                v-for="(src, index) in item.feedbackFileIds"
                style="width: 56px; height: 56px"
                :src="src"
                :zoom-rate="1.2"
                :max-scale="7"
                :min-scale="0.2"
                :preview-src-list="item.feedbackFileIds"
                :initial-index="index"
                fit="cover"
              />
            </div>
            <div class="other">
              <span class="grayWord">{{ item.createTime }}</span>
              <span
                class="expand"
                v-if="item.handleOpinion"
                @click="item.ifExpand = !item.ifExpand"
                >{{ item.ifExpand ? "收起" : "展开回复" }}</span
              >
            </div>

            <div class="reply" v-show="item.ifExpand && item.handleOpinion">
              <div class="replay_avatar">
                <img
                  style="height: 24px; width: 24px; border-radius: 50%"
                  src="@/assets/icons/logo@3x.png"
                />
                <span class="grayWord">平台答复：</span>
              </div>
              <span class="reply_word">{{ item.handleOpinion }}</span>
              <span class="grayWord reply_time">{{ item.handleTime }}</span>
            </div>
          </div>
        </div>
        <el-divider style="margin: 24px 0" />
      </div>
      <el-empty v-if="commentList.length === 0" />
    </el-scrollbar>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
const modal = defineModel("open", { type: Boolean, default: false });

import { myfeedback, resFeedback } from "api/feedback";
type commentList = resFeedback & {
  avatar: string;
  ifExpand: boolean;
};
const commentList = ref<Array<commentList>>([]);
const loading = ref(false);
watch(
  () => modal.value,
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
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.header {
  font-weight: bold;
  font-size: 16px;
  @include font_color("word");
}

.grayWord {
  @include font_color("word-gray");
}
.commentList {
  padding: 0 16px;
  height: 500px;
}
.comment {
  display: flex;
  font-size: var(--font-size);
  gap: 8px;
  .avatar {
    width: 40px;
    height: 40px;
  }
  .detail {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .word {
      line-height: 20px;
      @include font_color("word");
      word-break: break-all;
      word-wrap: break-word;
    }
    .images {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .other {
      display: flex;
      gap: 8px;
      .expand {
        @include font_color("primary");
        cursor: pointer;
        -moz-user-select: none;
        -o-user-select: none;
        -khtml-user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    }
    .reply {
      display: flex;
      flex-direction: column;
      margin-top: 21px;
    }
    .replay_avatar {
      height: 24px;
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .reply_word {
      margin-left: 32px;
    }
    .reply_time {
      margin-left: 32px;
      margin-top: 10px;
    }
  }
}
</style>
