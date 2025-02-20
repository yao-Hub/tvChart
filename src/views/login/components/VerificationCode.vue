<template>
  <el-input v-model="model" :placeholder="t('tip.codeRequired')">
    <template #suffix>
      <el-button
        link
        @click.stop="handleClick"
        :loading="loading"
        v-if="!showTimer"
      >
        <span class="sendbtn">{{ t("account.getCode") }}</span>
      </el-button>
      <span v-if="showTimer">{{
        t("tip.retakeCode", { time: leftTime })
      }}</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { sendEmail, IReqSendEmail } from "api/account/index";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  email: string;
  type: string;
}

const typeMap: Record<string, 1 | 2> = {
  forgetPwd: 2,
  // register： 1
};

const props = defineProps<Props>();

const model = defineModel<string>("value", { required: true });
const loading = ref(false);
const showTimer = ref(false);
const handleClick = async () => {
  try {
    loading.value = true;
    const type = typeMap[props.type];
    const updata: IReqSendEmail = {
      email: props.email,
    };
    if (type !== undefined) {
      updata.type = type;
    }
    const res = await sendEmail(updata);
    if (res.err === 0) {
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
  showTimer.value = true;
  timer.value && clearInterval(timer.value);
  timer.value = setInterval(() => {
    if (leftTime.value <= 1) {
      clearInterval(timer.value);
      leftTime.value = 60;
      showTimer.value = false;
    } else {
      leftTime.value--;
    }
  }, 1000);
};

const handleUnload = () => {
  if (timer.value) {
    clearInterval(timer.value);
    const codeTime = {
      leftTimeStamp: new Date().getTime() / 1000 + leftTime.value,
      type: props.type,
    };
    localStorage.setItem("codeTime", JSON.stringify(codeTime));
  }
};

onMounted(() => {
  const stoCodeTime = localStorage.getItem("codeTime");
  if (stoCodeTime) {
    const codeTime = JSON.parse(stoCodeTime);
    const { leftTimeStamp, type } = codeTime;
    if (type === props.type) {
      const hisTime = Math.ceil(leftTimeStamp - new Date().getTime() / 1000);
      if (hisTime > 1 && hisTime < 60) {
        leftTime.value = hisTime;
        startTimer();
      }
    }
  }
  window.addEventListener("beforeunload", handleUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleUnload);
  handleUnload();
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
