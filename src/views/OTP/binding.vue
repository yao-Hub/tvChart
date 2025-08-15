<template>
  <div class="binding">
    <div class="stepBox" v-if="step === 0">
      <el-text class="text">{{ t("otp.auth") }}</el-text>
      <br />
      <el-text type="info" class="text">{{ t("otp.needAuth") }}</el-text>

      <el-form
        ref="pwdFormRef"
        :model="pwdFormState"
        :rules="pwdFormrules"
        label-position="top"
        class="first_form"
      >
        <el-form-item :label="t('account.accountNum')" prop="login">
          <el-input v-model="useUser().account.login" disabled />
        </el-form-item>
        <el-form-item :label="t('account.password')" prop="pass">
          <el-input
            v-model="pwdFormState.pass"
            type="password"
            :placeholder="t('tip.passwordRequired')"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <div class="btnGroup">
        <el-button class="btn" @click="cancel">{{ t("cancel") }}</el-button>
        <el-button
          type="primary"
          class="btn"
          :disabled="!pwdFormState.pass"
          :loading="pwdLoading"
          @click="getCodeInfo"
          >{{ t("otp.verifyNow") }}</el-button
        >
      </div>
    </div>

    <div class="stepBox step-1" v-if="step === 1">
      <el-text>{{ t("otp.stepTitle") }}</el-text>
      <el-text>{{ t("otp.step_1") }}</el-text>
      <el-text type="info">{{ t("otp.step_2") }} </el-text>
      <el-text type="info">{{ t("otp.step_3") }}</el-text>
      <el-text>{{ t("otp.step_4") }}</el-text>

      <div class="btnGroup" style="margin-top: auto">
        <el-button class="btn" @click="changeStep('prev')">{{
          t("back")
        }}</el-button>
        <el-button type="primary" class="btn" @click="changeStep('next')">{{
          t("otp.nextStep")
        }}</el-button>
      </div>
    </div>

    <div class="step-2" v-if="step === 2">
      <QRCodeVue
        :value="qrcodeVal"
        :size="234"
        :margin="1"
        level="H"
        :image-settings="imageSettings"
      />
      <div class="codeBox">
        <el-form
          ref="codeFormRef"
          :model="codeFormState"
          :rules="codeFormrules"
          label-position="top"
        >
          <el-form-item :label="t('otp.codeLabel')" prop="code">
            <el-input
              v-model="codeFormState.code"
              :placeholder="t('tip.codeRequired')"
            />
          </el-form-item>
        </el-form>

        <el-tooltip
          placement="bottom-start"
          popper-class="otpTooltip"
          :show-arrow="false"
        >
          <span class="link">{{ t("otp.scanError") }}</span>
          <template #content>
            <div class="tipBox">
              <el-text>{{ t("otp.tipInput") }}</el-text>
              <div class="tipBox_info">
                <el-text type="info">{{ t("otp.accountName") }}</el-text>
                <el-text>{{ getAccount() }}</el-text>
                <el-text type="info">{{ t("otp.secretKey") }}</el-text>
                <el-text>{{ getSecret() }}</el-text>
              </div>
            </div>
          </template>
        </el-tooltip>

        <div class="btnGroup" style="margin-top: auto">
          <el-button class="btn" @click="changeStep('prev')">{{
            t("back")
          }}</el-button>
          <el-button
            type="primary"
            class="btn"
            :disabled="!codeFormState.code"
            @click="binding"
            >{{ t("otp.nextStep") }}</el-button
          >
        </div>
      </div>
    </div>

    <div class="step-3" v-if="step === 3">
      <BaseImg iconName="icon_success"></BaseImg>
      <el-text>{{ t("otp.bindSuccess") }}</el-text>
      <el-text type="info">{{ t("otp.bindSuccess_tip_1") }}</el-text>
      <el-text type="info">{{ t("otp.bindSuccess_tip_2") }}</el-text>
      <el-button type="primary" class="doneBtn" @click="handleDone">{{
        t("done")
      }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { FormRules } from "element-plus";
import { useI18n } from "vue-i18n";
import { debounce } from "lodash";
import { queryOTPQRCode, bindOTP } from "@/api/account";

import { useDialog } from "@/store/modules/dialog";
import { useUser } from "@/store/modules/user";
import { useSystem } from "@/store/modules/system";

import QRCodeVue from "qrcode.vue";
import type { ImageSettings } from "qrcode.vue";

const { t } = useI18n();

interface PwdFormState {
  pass: string;
}

const pwdFormState = reactive<PwdFormState>({
  pass: "",
});
const pwdFormrules = reactive<FormRules<typeof pwdFormState>>({
  pass: [
    { required: true, trigger: "blur", message: t("tip.passwordRequired") },
  ],
});

interface CodeFormState {
  code: string;
}
const codeFormState = reactive<CodeFormState>({
  code: "",
});
const codeFormrules = reactive<FormRules<typeof codeFormState>>({
  code: [{ required: true, trigger: "blur", message: t("tip.codeRequired") }],
});

const scanCodeImage = new URL(
  `../../assets/icons/scanCodeLogo.svg`,
  import.meta.url
).href;
const imageSettings = ref<ImageSettings>({
  src: scanCodeImage,
  width: 32,
  height: 32,
});

const cancel = () => {
  useDialog().closeDialog("OTPVisible");
};

const step = ref(0);
const changeStep = debounce((type: "next" | "prev") => {
  if (type === "next") {
    step.value++;
  } else {
    step.value--;
  }
  if (step.value > 3) {
    step.value = 3;
  }
  if (step.value < 0) {
    step.value = 0;
  }
});

const pwdLoading = ref(false);
const qrcodeVal = ref("");
const getCodeInfo = () => {
  pwdLoading.value = true;
  queryOTPQRCode({ password: pwdFormState.pass }).then(
    (res) => {
      pwdLoading.value = false;
      qrcodeVal.value = res.data.code_content;
      changeStep("next");
    },
    () => {
      pwdLoading.value = false;
    }
  );
};

const getAccount = () => {
  const accountSection = qrcodeVal.value.split("?")[0];
  const account = accountSection.split(":").pop();
  return account;
};
const getSecret = () => {
  const secretSection = qrcodeVal.value.split("?")[1];
  const secret = secretSection.split("=").pop();
  return secret;
};

const bindingLoading = ref(false);
const binding = () => {
  bindingLoading.value = true;
  bindOTP({
    password: pwdFormState.pass,
    otp_code: codeFormState.code,
    device_id: useSystem().systemInfo!.deviceId,
  }).then(
    () => {
      bindingLoading.value = false;
      changeStep("next");
    },
    () => {
      bindingLoading.value = false;
    }
  );
};

const handleDone = () => {
  useUser().executeLogic(); // 个人信息
  cancel();
};
</script>

<style>
.otpTooltip {
  padding: 0;
  z-index: 9999 !important;
  border: none !important;
}
</style>
<style lang="scss" scoped>
@import "@/styles/_handle.scss";
[data-theme="light"] .tipBox {
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05),
    0px 6px 16px 0px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
}
[data-theme="dark"] .tipBox {
  box-shadow: 0px 9px 28px 8px rgba(0, 0, 0, 0.05),
    0px 6px 16px 0px rgba(0, 0, 0, 0.08), 0px 3px 6px -4px rgba(0, 0, 0, 0.12);
}
:deep(.el-input__wrapper) {
  height: var(--base-height);
}
:deep(.el-button) {
  height: var(--base-height);
}
:deep(.el-button + .el-button) {
  margin-left: 0;
}

.binding {
  padding-top: 24px;
  height: 290px;
}
.text {
  align-self: flex-start;
}
.stepBox {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.step-1 {
  gap: 16px;
  span {
    align-self: flex-start;
    line-height: 20px;
    font-size: 14px;
  }
  span:first-child {
    font-size: 16px;
  }
}
.step-2 {
  display: flex;
  height: 100%;
  gap: 16px;
  .codeBox {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 234px;
  }
}
.step-3 {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 20px;
  text-align: center;
  .icon_success {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }
  span:first-child {
    margin-bottom: 8px;
  }
  .doneBtn {
    width: 234px;
    height: var(--base-height);
    margin-top: 24px;
  }
}
.first_form {
  margin-top: 16px;
  margin-bottom: 8px;
}
.btnGroup {
  width: 100%;
  display: flex;
  gap: 16px;
  .btn {
    flex: 1;
  }
}
.link {
  width: fit-content;
}
.tipBox {
  width: 320px;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 4px;
  border: 1px solid;
  @include background_color("background-container");
  @include border_color("border");
  &_info {
    margin-top: 16px;
    padding: 8px;
    display: flex;
    flex-direction: column;
    border: 1px solid;
    gap: 4px;
    word-break: break-all;
    @include border_color("border");
    span {
      align-self: flex-start;
    }
  }
}
</style>
