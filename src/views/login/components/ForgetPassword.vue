<template>
  <div class="container">
    <div class="container_header">
      <div class="container_header_goback" @click="emit('goBack')">
        <LeftOutlined />
        <span>返回</span>
      </div>
    </div>
    <div class="container_main">
      <div class="container_main_title">
        <img src="@/assets/icons/logo@3x.png" />
        <div class="container_main_title_right">
          <span class="up">{{ props.lineInfo.lineName }}</span>
          <span class="down">{{ props.lineInfo.brokerName }}</span>
        </div>
      </div>
      <a-form
        ref="formRef"
        size="large"
        name="form"
        layout="vertical"
        :model="formState"
        :labelCol="{ span: 10 }"
        :rules="rules"
        @finish="onFinish"
      >
        <a-form-item name="email" :label="$t('user.email')">
          <a-auto-complete
            v-model:value="formState.email"
            placeholder="input email"
            :options="options"
            @search="handleSearch"
          >
            <template #option="{ value: val }">
              {{ val.split("@")[0] }} @
              <span style="font-weight: bold">{{ val.split("@")[1] }}</span>
            </template>
          </a-auto-complete>
        </a-form-item>

        <a-form-item name="code" :label="$t('account.verificationCode')">
          <a-input v-model:value="formState.code" placeholder="code">
            <template #suffix>
              <span class="link">{{ $t("account.sendCode") }}</span>
            </template>
          </a-input>
        </a-form-item>

        <a-form-item has-feedback :label="$t('user.newPassword')" name="pass">
          <a-input
            v-model:value="formState.pass"
            type="password"
            autocomplete="off"
            placeholder="enter new password"
          />
        </a-form-item>

        <a-form-item has-feedback name="checkPass">
          <a-input
            v-model:value="formState.checkPass"
            type="password"
            autocomplete="off"
            placeholder="confirm new password"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            class="submit-button"
            :disabled="!isFormValid"
            >{{ $t("account.resetPassword") }}</a-button
          >
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import type { Rule } from "ant-design-vue/es/form";
import { message, type FormInstance } from "ant-design-vue";
import { LeftOutlined } from "@ant-design/icons-vue";
import { emailPasswordUpdate, resQueryTradeLine } from "api/account/index";

interface Props {
  lineInfo: resQueryTradeLine;
}
const props = defineProps<Props>();

const emit = defineEmits(["goBack"]);
const options = ref<{ value: string }[]>([]);

const handleSearch = (val: string) => {
  let res: { value: string }[];
  if (!val || val.indexOf("@") >= 0) {
    res = [];
  } else {
    res = ["gmail.com", "163.com", "qq.com", "126.com", "souhu.com"].map(
      (domain) => ({ value: `${val}@${domain}` })
    );
  }
  options.value = res;
};

interface FormState {
  email: string;
  code: string;
  pass: string;
  checkPass: string;
}

const formState = reactive<FormState>({
  code: "",
  email: "",
  pass: "",
  checkPass: "",
});
const formRef = ref<FormInstance>();
const validatePass = async (_rule: Rule, value: string) => {
  if (value === "") {
    return Promise.reject("Please input the password");
  } else {
    // 匹配6-24位数字和字母组合，不能包含空格
    const regex = /^[a-zA-Z0-9]{6,24}$/;
    if (regex.test(value)) {
      Promise.resolve();
    } else {
      return Promise.reject("must be 6-24 digits and letters, without spaces");
    }
    if (formState.checkPass !== "") {
      formRef.value?.validateFields("checkPass");
    }
    return Promise.resolve();
  }
};
const validatePass2 = async (_rule: Rule, value: string) => {
  if (value === "") {
    return Promise.reject("Please input the password again");
  } else if (value !== formState.pass) {
    return Promise.reject("Two inputs don't match!");
  } else {
    return Promise.resolve();
  }
};

const rules: Record<string, Rule[]> = {
  email: [{ required: true, message: "Please input your email!" }],
  code: [{ required: true, message: "Please input your code!" }],
  pass: [{ required: true, validator: validatePass, trigger: "change" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "change" }],
};

const isFormValid = ref(false);

const validateForm = () => {
  formRef.value
    ?.validateFields()
    .then(() => {
      isFormValid.value = true;
    })
    .catch(() => {
      isFormValid.value = false;
    });
};

watch(() => formState, validateForm, { deep: true });

const onFinish = async (values: any) => {
  const { code, email, pass, checkPass } = values;
  await emailPasswordUpdate({
    server: props.lineInfo.lineCode,
    email,
    verify_code: code,
    new_password: pass,
    confirm_password: checkPass,
  });
  message.success('reset success');
  emit('goBack');
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/_handle.scss";

.container {
  position: relative;
  width: 512px;
  height: 648px;
  border-radius: 16px;
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05);
  @include background_color("background");
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  &_header {
    width: 100%;
    height: 64px;
    display: flex;
    align-items: center;
    margin-left: 32px;
    &_goback {
      cursor: pointer;
      display: flex;
      gap: 4px;
    }
  }
  &_main {
    padding: 32px 56px;
    &_title {
      display: flex;
      height: 68px;
      margin-bottom: 37px;
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
    height: 56px;
    border-radius: 8px;
    margin-top: 28px;
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
