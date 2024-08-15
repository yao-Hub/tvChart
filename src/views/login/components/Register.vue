<template>
  <div class="container">
    <div class="container_header">
      <div class="container_header_goback" @click="back">
        <LeftOutlined />
        <span>返回</span>
      </div>
    </div>
    <div class="container_main" v-if="!ifSuccess">
      <div class="container_main_title">
        <img src="@/assets/icons/logo@3x.png" />
        <div class="container_main_title_right">
          <span class="up">{{ props.lineInfo.lineName }}</span>
          <span class="down">{{ props.lineInfo.brokerName }}</span>
        </div>
      </div>
      <a-form
        size="large"
        name="basic"
        layout="vertical"
        :model="formState"
        :labelCol="{ span: 6 }"
        :rules="rules"
        @finish="onFinish"
      >
        <a-form-item :label="$t('user.email')" name="email">
          <a-auto-complete
            v-model:value="formState.email"
            placeholder="email"
            :options="emailOptions"
            @search="handleSearch"
          >
            <template #option="{ value: val }">
              {{ val.split("@")[0] }} @
              <span style="font-weight: bold">{{ val.split("@")[1] }}</span>
            </template>
          </a-auto-complete>
        </a-form-item>

        <a-form-item :label="$t('account.verificationCode')" name="code">
          <a-input v-model:value="formState.code" placeholder="Basic usage">
            <template #suffix>
              <span class="link">{{ $t("account.sendCode") }}</span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="agree" no-style>
          <a-checkbox v-model:checked="formState.agree">{{
            $t("tip.agree")
          }}</a-checkbox>
        </a-form-item>

        <a-form-item no-style>
          <a-button
            type="primary"
            html-type="submit"
            class="submit-button"
            :disabled="!btnDisabled"
            >{{ $t("account.register") }}</a-button
          >
        </a-form-item>
      </a-form>
    </div>

    <div class="success-card" v-else>
      <div class="success-card_tip">
        <CheckCircleFilled style="color: #f4b201; font-size: 40px" />
        <span style="font-size: 24px">创建模拟账号成功</span>
      </div>
      <div class="success-card_account">
        <span>账号： {{ account.name }}</span>
        <span>密码： {{ account.pass }}</span>
        <span @click="copy" class="copy">复制</span>
      </div>
      <span class="success-card_word">请妥善保存好您的帐户和密码</span>
      <a-button type="primary" class="success-card_btn" @click="emit('goBack')"
        >开始使用模拟账号</a-button
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { LeftOutlined, CheckCircleFilled } from "@ant-design/icons-vue";
import { ref, reactive, computed } from "vue";
import { message } from "ant-design-vue";
import { register, resQueryTradeLine } from "api/account/index";
import type { Rule } from "ant-design-vue/es/form";

interface Props {
  lineInfo: resQueryTradeLine;
}
const props = defineProps<Props>();

const emit = defineEmits(["goBack"]);

interface FormState {
  email: string;
  code: string;
  agree: boolean;
}
const formState = reactive<FormState>({
  code: "",
  email: "",
  agree: false,
});
const rules: Record<string, Rule[]> = {
  email: [
    {
      required: true,
      trigger: "change",
      message: "Please input your email!",
    },
  ],
  code: [
    {
      required: true,
      message: "Please input your code!",
      trigger: "change",
    },
  ],
};
const emailOptions = ref<{ value: string }[]>([]);
const handleSearch = (val: string) => {
  let res: { value: string }[];
  if (!val || val.indexOf("@") >= 0) {
    res = [];
  } else {
    res = ["gmail.com", "163.com", "qq.com", "126.com", "souhu.com"].map(
      (domain) => ({ value: `${val}@${domain}` })
    );
  }
  emailOptions.value = res;
};
const btnDisabled = computed(() => {
  return Object.values(formState).every((value) => Boolean(value));
});
const ifSuccess = ref<boolean>(false);
const account = reactive({
  name: "",
  pass: "",
});
const onFinish = async (values: any) => {
  const { agree, code, email } = values;
  if (!agree) {
    message.warning("请同意条款");
    return;
  }
  const res = await register({
    server: props.lineInfo.lineCode,
    email,
    verify_code: code,
  });
  account.name = res.data.login;
  account.pass = res.data.password;
  ifSuccess.value = true;
};

const back = () => {
  if (ifSuccess.value) {
    ifSuccess.value = !ifSuccess.value;
    return;
  }
  emit("goBack");
};

import useClipboard from "vue-clipboard3";
const { toClipboard } = useClipboard();
const copy = async () => {
  try {
    await toClipboard(`账号：${account.name};密码：${account.pass}`);
    message.success("复制成功");
  } catch (e) {
    console.log(e);
    message.error("复制失败");
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.container {
  position: relative;
  width: 512px;
  height: 648px;
  border-radius: 8px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background-component");
  box-sizing: border-box;
  &_header {
    width: 100%;
    height: 64px;
    display: flex;
    align-items: center;
    padding-left: 32px;
    box-sizing: border-box;
    &_goback {
      cursor: pointer;
      display: flex;
      gap: 4px;
    }
  }
  &_main {
    padding: 32px 56px;
    width: 100%;
    box-sizing: border-box;
    &_title {
      display: flex;
      height: 68px;
      margin-bottom: 24px;
      img {
        width: 64px;
        height: 64px;
        margin-right: 16px;
      }
      &_right {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        .up {
          font-size: 16px;
        }
        .down {
          font-size: 12px;
          @include font_color("word-gray");
        }
      }
    }
  }
  .submit-button {
    width: 400px;
    height: 48px;
    border-radius: 8px;
    margin-top: 32px;
  }
  .success-card {
    margin-top: 84px;
    &_tip {
      padding-left: 56px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    &_account {
      display: flex;
      gap: 24px;
      padding-left: 115px;
      font-size: 16px;
      margin-top: 16px;
      .copy {
        font-size: 16px;
        color: #f4b201;
        @include font_color("primary");
        cursor: pointer;
      }
    }
    &_word {
      padding-left: 115px;
      display: block;
      font-size: 16px;
      margin-top: 32px;
    }
    &_btn {
      width: 400px;
      height: 48px;
      border-radius: 8px;
      margin: 158px 56px;
      @include font_color("word");
    }
  }
}

.link {
  @include font_color("word-gray");
  font-size: 12px;
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>
