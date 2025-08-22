<template>
  <el-dialog
    v-if="model"
    v-model="model"
    width="496"
    destroy-on-close
    :show-close="false"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog_title">
        <span :id="titleId" :class="titleClass" v-if="!ifSuccess">
          {{ t("account.deleteAccount") }}
        </span>
        <el-icon class="closeBtn" @click="close"><Close /></el-icon>
      </div>
    </template>

    <el-form
      :model="formState"
      label-position="top"
      :rules="rules"
      ref="formRef"
      class="cancel-account-form"
      v-if="!ifSuccess"
    >
      <el-form-item prop="email" :label="t('account.email')">
        <el-input
          :value="email"
          :placeholder="t('tip.emailRequired')"
          disabled
        />
      </el-form-item>

      <el-form-item :label="t('account.verificationCode')" prop="code">
        <VerificationCode
          type="cancelAccount"
          v-model:value="formState.code"
          :email="email"
        ></VerificationCode>
      </el-form-item>

      <el-button
        type="primary"
        class="submit-button"
        :loading="loading"
        :disabled="btnDisabled"
        @click="submit(formRef)"
      >
        <span>{{ t("deposit.goOn") }}</span>
      </el-button>
    </el-form>

    <div class="success-card" v-if="ifSuccess">
      <BaseImg class="typeIcon" iconName="icon_success" />
      <span class="tipSuc">{{ t("signOut.cancellationNotice") }}</span>
      <span class="tipSav">{{ t("signOut.loggedOut") }}</span>
      <el-button class="startUseBtn" type="primary" @click="handleUnderstood">
        <span>{{ t("signOut.understood") }}</span>
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";

import { cancelVirtualAccount } from "api/account";

import { useNetwork } from "@/store/modules/network";
import { useUser } from "@/store/modules/user";
import { PageEnum } from "@/constants/pageEnum";

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);

const model = defineModel<boolean>("visible", {
  required: true,
  default: false,
});

interface FormState {
  code: string;
}
const formState = reactive<FormState>({
  code: "",
});
const formRef = ref<FormInstance>();

const rules = reactive<FormRules<typeof formState>>({
  code: [
    {
      required: true,
      message: t("tip.codeRequired"),
      trigger: ["blur", "change"],
    },
  ],
});

const email = computed(() => {
  return useUser().state.loginInfo?.email || "";
});

const btnDisabled = computed(() => {
  return !formState.code || !email.value;
});

const emit = defineEmits(["submitSuccess"]);
const ifSuccess = ref(false);
const submit = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        await cancelVirtualAccount({
          login: useUser().account.login,
          lineName: useNetwork().currentLine?.lineName || "",
          email: email.value,
          verify_code: formState.code,
        });
        ifSuccess.value = true;
        emit("submitSuccess");
      } catch {
        ifSuccess.value = false;
        loading.value = false;
      }
    }
  });
};

// 注销成功
const handleUnderstood = () => {
  const account = useUser().account;
  useUser().removeAccount(account);
  router.push({
    path: PageEnum.LOGIN_HOME,
  });
};
</script>

<style lang="scss" scoped>
@import "@/styles/_handle.scss";
:deep(.el-select__wrapper),
:deep(.el-input__wrapper) {
  height: calc(var(--base-height) + 8px);
  font-weight: normal;
}
:deep(.el-button) {
  height: calc(var(--base-height));
}
.cancel-account-form {
  margin-top: 24px;
}
.submit-button {
  width: 100%;
  border-radius: 4px;
  font-weight: 400;
  margin: 20px 0;
  font-size: 16px;
}
.success-card {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  height: 290px;
  .tipSuc {
    font-weight: 500;
    font-size: 18px;
    margin-top: 16px;
  }
  .tipSav {
    margin-top: 8px;
    font-weight: 400;
    font-size: 14px;
    @include font_color("word-gray");
  }
  .typeIcon {
    width: 64px;
    height: 64px;
  }
  .startUseBtn {
    width: 110px;
    font-weight: 400;
    font-size: 16px;
    margin-top: 24px;
  }
}
</style>
