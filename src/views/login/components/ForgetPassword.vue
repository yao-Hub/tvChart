<template>
  <div class="forget scrollList">
    <div class="goback">
      <div @click="back">
        <el-icon>
          <BaseImg iconName="turnleft" />
        </el-icon>
        <span>{{ $t("back") }}</span>
      </div>
    </div>
    <div class="forget_title">
      <BaseImg class="img" type="online" :src="lineInfo.lineLogo" />
      <div class="forget_title_right">
        <span class="up">{{ lineInfo.lineName }}</span>
        <span class="down">{{ lineInfo.brokerName }}</span>
      </div>
    </div>
    <el-form
      class="forget_form"
      ref="formRef"
      :model="formState"
      :rules="rules"
      label-position="top"
    >
      <el-form-item prop="email" :label="$t('account.email')">
        <el-autocomplete
          v-model="formState.email"
          :fetch-suggestions="querySearch"
          :trigger-on-focus="false"
          clearable
          placeholder="input email"
        />
      </el-form-item>

      <el-form-item prop="code" :label="$t('account.verificationCode')">
        <VerificationCode
          v-model:value="formState.code"
          :email="formState.email"
        ></VerificationCode>
      </el-form-item>

      <el-form-item :label="$t('account.newPassword')" prop="pass">
        <el-input
          v-model="formState.pass"
          type="password"
          placeholder="enter new password"
          show-password
        />
      </el-form-item>

      <el-form-item prop="checkPass">
        <el-input
          v-model="formState.checkPass"
          type="password"
          placeholder="confirm new password"
          show-password
        />
      </el-form-item>

      <el-button
        type="primary"
        class="submit-button"
        :disabled="!formValid"
        @click="resetPwd"
        >{{ $t("account.resetPassword") }}</el-button
      >
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { emailPasswordUpdate } from "api/account/index";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";

import { useNetwork } from "@/store/modules/network";

import { PageEnum } from "@/constants/pageEnum";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const networkStore = useNetwork();

const lineInfo = computed(() => {
  const server = route.params.server;
  const target = networkStore.queryTradeLines.find(
    (e) => e.lineName === server
  );
  if (target) {
    return target;
  }
  return {
    lineName: "",
    brokerName: "",
    lineLogo: "",
  };
});

const querySearch = (queryString: string, cb: any) => {
  let res: { value: string }[];
  if (!queryString || queryString.indexOf("@") >= 0) {
    res = [];
  } else {
    res = ["gmail.com", "163.com", "qq.com", "126.com", "souhu.com"].map(
      (domain) => ({ value: `${queryString}@${domain}` })
    );
  }
  cb(res);
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
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error(t("tip.passwordRequired")));
  } else {
    // 匹配6-24位数字和字母组合，不能包含空格
    const regex = /^[a-zA-Z0-9]{6,24}$/;
    if (regex.test(value)) {
      callback();
    } else {
      callback(new Error(t("tip.passwordFormatRule")));
    }
    if (formState.checkPass !== "") {
      formRef.value?.validateField("checkPass");
    }
    callback();
  }
};
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error(t("tip.reInputPassword")));
  } else if (value !== formState.pass) {
    callback(new Error(t("tip.noSamePassword")));
  } else {
    callback();
  }
};

const rules = reactive<FormRules<typeof formState>>({
  email: [{ required: true, message: t("tip.emailRequired"), trigger: "blur" }],
  code: [{ required: true, message: t("tip.codeRequired"), trigger: "blur" }],
  pass: [{ required: true, validator: validatePass, trigger: "blur" }],
  checkPass: [{ required: true, validator: validatePass2, trigger: "blur" }],
});

const formValid = ref(false);

const validateForm = () => {
  formRef.value?.validate((valid: any) => {
    formValid.value = valid;
  });
};

watch(() => formState, validateForm, { deep: true });

const resetPwd = async () => {
  if (!formValid.value) {
    return;
  }
  const { code, email, pass, checkPass } = formState;
  await emailPasswordUpdate({
    server: lineInfo.value.lineName,
    email,
    verify_code: code,
    new_password: pass,
    confirm_password: checkPass,
  });
  ElMessage.success(t("tip.resetPwdSuccess"));
  router.push({
    path: PageEnum.LOGIN_HOME,
    query: { server: lineInfo.value.lineName },
  });
};

const back = () => {
  router.back();
};

import { onMounted, onUnmounted } from "vue";
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    resetPwd();
  }
}
onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});
onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";

.forget {
  padding: 0 32px 0 32px;
  overflow: auto;
  box-sizing: border-box;
  height: 100%;
  &_title {
    display: flex;
    height: 68px;
    .img {
      width: 64px;
      height: 64px;
      margin-right: 16px;
      border-radius: 50%;
    }
    &_right {
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      .up {
        font-size: 16px;
      }
      .down {
        @include font_color("word-gray");
      }
    }
  }
  &_form {
    margin-top: 24px;
  }
  .submit-button {
    width: 100%;
    height: 48px;
    border-radius: 8px;
    font-weight: 400;
    font-size: 16px;
  }
}

.link {
  @include font_color("word-gray");
  font-size: var(--font-size);
  cursor: pointer;
  &:hover {
    @include font_color("primary");
  }
}
</style>
