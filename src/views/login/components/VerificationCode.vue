<template>
  <el-input v-model="model" placeholder="verification code">
    <template #suffix>
      <el-button
        link
        @click.stop="handleClick"
        :loading="loading"
        v-if="!showTimer"
      >
        <span class="sendbtn">{{ $t("account.getCode") }}</span>
      </el-button>
      <span v-if="showTimer">{{ leftTime }} 秒后可重新获取</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { sendEmail } from "api/account/index";
import { onBeforeUnmount, ref } from "vue";

interface Props {
  email: string;
}
const props = defineProps<Props>();

const model = defineModel<string>("value", { required: true });
const loading = ref(false);
const showTimer = ref(false);
const handleClick = async () => {
  try {
    loading.value = true;
    const res = await sendEmail({ email: props.email });
    if (res.err === 0) {
      showTimer.value = true;
      startTimer();
    }
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};
const timer = ref();
const leftTime = ref(60);
const startTimer = () => {
  timer.value && clearInterval(timer.value);
  timer.value = setInterval(() => {
    if (leftTime.value <= 0) {
      clearInterval(timer.value);
      leftTime.value = 60;
      showTimer.value = false;
    } else {
      leftTime.value--;
    }
  }, 1000);
};

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.sendbtn {
  @include font_color("word-gray");
  &:hover {
    @include font_color("primary");
  }
}
</style>
