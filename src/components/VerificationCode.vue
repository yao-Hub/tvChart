<template>
  <!-- 模板部分无需改动 -->
  <el-input v-model="model" :placeholder="t('tip.codeRequired')">
    <template #suffix>
      <el-button
        link
        @click.stop="handleClick"
        :loading="loading"
        v-if="!currentTimer.showTimer"
      >
        <span class="sendbtn">{{ t("account.getCode") }}</span>
      </el-button>
      <span v-if="currentTimer.showTimer">{{
        t("tip.retakeCode", { time: currentTimer.leftTime })
      }}</span>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { sendEmail, IReqSendEmail } from "api/account/index";
import { onBeforeUnmount, onMounted, ref, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  email: string;
  type: string;
}

const typeMap: Record<string, number> = {
  forgetPwd: 2,
  register: 4,
  deposit: 3,
};

const props = defineProps<Props>();

// 使用对象存储所有类型的定时器状态
const timers = ref<
  Record<
    string,
    {
      timerId?: number;
      leftTime: number;
      showTimer: boolean;
    }
  >
>({});

// 计算当前type对应的定时器状态
const currentTimer = computed(() => {
  return (
    timers.value[props.type] || {
      leftTime: 60,
      showTimer: false,
    }
  );
});

const model = defineModel<string>("value", { required: true });
const loading = ref(false);

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
      startTimer(props.type);
    }
    loading.value = false;
  } catch (error) {
    loading.value = false;
  }
};

const startTimer = (type: string) => {
  // 初始化当前类型的定时器
  if (!timers.value[type]) {
    timers.value[type] = {
      leftTime: 60,
      showTimer: false,
    };
  }

  const timerData = timers.value[type];
  timerData.showTimer = true;
  timerData.leftTime = 60;

  // 清除旧定时器
  if (timerData.timerId) {
    clearInterval(timerData.timerId);
  }

  timerData.timerId = setInterval(() => {
    if (timerData.leftTime <= 1) {
      clearInterval(timerData.timerId!);
      timerData.showTimer = false;
      timerData.leftTime = 60;
    } else {
      timerData.leftTime--;
    }
  }, 1000) as unknown as number;
};

const handleUnload = () => {
  Object.entries(timers.value).forEach(([type, timerData]) => {
    if (timerData.timerId) {
      clearInterval(timerData.timerId);
      const codeTime = {
        leftTimeStamp: new Date().getTime() / 1000 + timerData.leftTime,
        type: type,
      };
      // 为每个type独立存储
      localStorage.setItem(`codeTime_${type}`, JSON.stringify(codeTime));
    }
  });
};

onMounted(() => {
  // 按type恢复计时器
  const storedCodeTime = localStorage.getItem(`codeTime_${props.type}`);
  if (storedCodeTime) {
    const codeTime = JSON.parse(storedCodeTime);
    const { leftTimeStamp, type } = codeTime;
    const hisTime = Math.ceil(leftTimeStamp - new Date().getTime() / 1000);

    if (hisTime > 1 && hisTime < 60) {
      if (!timers.value[type]) {
        timers.value[type] = {
          leftTime: hisTime,
          showTimer: true,
        };
      }
      startTimer(type);
    }
  }

  window.addEventListener("beforeunload", handleUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", handleUnload);
  // 清除所有定时器
  Object.values(timers.value).forEach((timerData) => {
    if (timerData.timerId) clearInterval(timerData.timerId);
  });
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
